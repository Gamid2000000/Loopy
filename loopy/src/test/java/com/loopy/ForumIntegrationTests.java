package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.persistence.EntityManagerFactory;

import com.loopy.model.User;
import com.loopy.model.enumeration.ForumCategoryStatus;
import com.loopy.model.enumeration.ForumPostStatus;
import com.loopy.model.enumeration.ForumTopicStatus;
import com.loopy.model.ForumCategory;
import com.loopy.model.ForumPost;
import com.loopy.model.ForumTopic;
import com.loopy.repository.UserProfileRepository;
import com.loopy.repository.UserRepository;
import com.loopy.repository.ForumCategoryRepository;
import com.loopy.repository.ForumPostRepository;
import com.loopy.repository.ForumTopicRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CreateForumPostRequest;
import com.loopy.service.ForumService;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@AutoConfigureMockMvc
class ForumIntegrationTests {

    @Autowired MockMvc mvc;
    @Autowired ForumCategoryRepository categories;
    @Autowired ForumTopicRepository topics;
    @Autowired ForumPostRepository posts;
    @Autowired UserRepository users;
    @Autowired UserProfileRepository profiles;
    @Autowired ForumService forumService;
    @Autowired EntityManagerFactory entityManagerFactory;

    @AfterEach
    void clean() {
        posts.deleteAll();
        topics.deleteAll();
        categories.deleteAll();
        profiles.deleteAll();
        users.deleteAll();
    }

    @BeforeEach
    void cleanBefore() {
        clean();
    }

    @Test
    void categoriesArePublicAggregatedAndDoNotExposeHiddenCategories() throws Exception {
        ForumCategory visible = category("visible", ForumCategoryStatus.ACTIVE, 2);
        ForumCategory hidden = category("hidden", ForumCategoryStatus.HIDDEN, 1);
        User author = user("author@example.com");
        topic(visible, author, "Active", ForumTopicStatus.ACTIVE, Instant.parse("2026-08-01T10:00:00Z"));
        topic(visible, author, "Hidden", ForumTopicStatus.HIDDEN, Instant.parse("2026-08-02T10:00:00Z"));
        topic(hidden, author, "Invisible", ForumTopicStatus.ACTIVE, Instant.parse("2026-08-03T10:00:00Z"));

        mvc.perform(get("/forum/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("visible"))
                .andExpect(jsonPath("$[0].topicsCount").value(1))
                .andExpect(jsonPath("$[0].lastActivityAt").value("2026-08-01T10:00:00Z"));
    }

    @Test
    void topicReadsArePublicStableAndPostsArePlainText() throws Exception {
        ForumCategory category = category("general", ForumCategoryStatus.ACTIVE, 0);
        User author = user("author@example.com");
        ForumTopic older = topic(category, author, "Older title", ForumTopicStatus.ACTIVE,
                Instant.parse("2026-08-01T10:00:00Z"));
        ForumTopic newer = topic(category, author, "Newer title", ForumTopicStatus.ACTIVE,
                Instant.parse("2026-08-02T10:00:00Z"));
        savePost(older, author, "first valid <script>alert(1)</script>", Instant.parse("2026-08-01T09:00:00Z"));
        savePost(older, author, "second valid response", Instant.parse("2026-08-01T11:00:00Z"));

        mvc.perform(get("/forum/categories/general/topics?size=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(newer.getId()))
                .andExpect(jsonPath("$.content[0].author.email").doesNotExist());
        mvc.perform(get("/forum/topics/{id}", older.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.slug").value("general"))
                .andExpect(jsonPath("$.posts.content[0].content").value("first valid <script>alert(1)</script>"))
                .andExpect(jsonPath("$.posts.content[0].author.email").doesNotExist());
        mvc.perform(get("/forum/topics/999999"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("FORUM_TOPIC_NOT_FOUND"));
    }

    @Test
    void authenticatedUserCreatesTopicAndReplyWithNormalizedContent() throws Exception {
        ForumCategory category = category("general", ForumCategoryStatus.ACTIVE, 0);
        String token = register("author@example.com");

        mvc.perform(post("/forum/categories/general/topics")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"  Valid title  \",\"content\":\"  first valid content  \"}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/forum/categories/general/topics").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"<b>Valid title</b>\",\"content\":\"first valid content\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_TITLE_INVALID"));

        String result = mvc.perform(post("/forum/categories/general/topics")
                .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"  Valid title  \",\"content\":\"  first\\r\\ncontent  \"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.categorySlug").value("general"))
                .andReturn().getResponse().getContentAsString();
        long topicId = Long.parseLong(result.replaceFirst(".*\\\"topicId\\\":(\\d+).*", "$1"));

        mvc.perform(post("/forum/topics/{id}/posts", topicId).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"  reply\\rtext  \"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.postsCount").value(2));
        mvc.perform(get("/forum/topics/{id}", topicId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Valid title"))
                .andExpect(jsonPath("$.posts.content[0].content").value("first\ncontent"))
                .andExpect(jsonPath("$.posts.content[1].content").value("reply\ntext"));
        assertThat(category.getSlug()).isEqualTo("general");
    }

    @Test
    void hiddenAndLockedResourcesHaveSafeResponsesAndExistingRoutesStayProtected() throws Exception {
        ForumCategory hidden = category("hidden", ForumCategoryStatus.HIDDEN, 0);
        ForumCategory visible = category("visible", ForumCategoryStatus.ACTIVE, 1);
        User author = user("author@example.com");
        ForumTopic locked = topic(visible, author, "Locked title", ForumTopicStatus.ACTIVE, Instant.now());
        locked.setLocked(true);
        topics.save(locked);
        String token = register("writer@example.com");

        mvc.perform(get("/forum/categories/hidden/topics"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("FORUM_CATEGORY_NOT_FOUND"));
        mvc.perform(post("/forum/categories/hidden/topics").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Valid title\",\"content\":\"valid content\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/forum/topics/{id}/posts", locked.getId()).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"valid content\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("FORUM_TOPIC_LOCKED"));
        mvc.perform(get("/decks")).andExpect(status().isUnauthorized());
    }

    @Test
    void concurrentRepliesDoNotLoseTheTopicCounterOnH2() throws Exception {
        ForumCategory category = category("general", ForumCategoryStatus.ACTIVE, 0);
        User topicAuthor = user("author@example.com");
        ForumTopic topic = topic(category, topicAuthor, "Concurrent title", ForumTopicStatus.ACTIVE, Instant.now());
        User first = user("first@example.com");
        User second = user("second@example.com");
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> one = executor.submit(() -> replyAfterStart(ready, start, first, topic.getId()));
            Future<?> two = executor.submit(() -> replyAfterStart(ready, start, second, topic.getId()));
            ready.await();
            start.countDown();
            one.get();
            two.get();
        } finally {
            executor.shutdownNow();
        }

        assertThat(posts.count()).isEqualTo(2);
        assertThat(topics.findById(topic.getId()).orElseThrow().getPostsCount()).isEqualTo(3);
    }

    @Test
    void publicProjectionQueriesDoNotGrowWithAuthorsOrPosts() throws Exception {
        ForumCategory category = category("general", ForumCategoryStatus.ACTIVE, 0);
        User author = user("author@example.com");
        ForumTopic topic = topic(category, author, "Projection title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "first projection content", Instant.now());
        savePost(topic, author, "second projection content", Instant.now());
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);

        sessionFactory.getStatistics().clear();
        mvc.perform(get("/forum/categories/general/topics")).andExpect(status().isOk());
        assertThat(sessionFactory.getStatistics().getQueryExecutionCount()).isLessThanOrEqualTo(2);

        sessionFactory.getStatistics().clear();
        mvc.perform(get("/forum/topics/{id}", topic.getId())).andExpect(status().isOk());
        assertThat(sessionFactory.getStatistics().getQueryExecutionCount()).isLessThanOrEqualTo(3);
    }

    private void replyAfterStart(CountDownLatch ready, CountDownLatch start, User user, Long topicId) {
        try {
            ready.countDown();
            start.await();
            forumService.createPost(new UserPrincipal(user.getEmail(), "test"), topicId,
                    new CreateForumPostRequest("concurrent reply"));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(ex);
        }
    }

    private ForumCategory category(String slug, ForumCategoryStatus status, int position) {
        Instant now = Instant.now();
        return categories.save(ForumCategory.builder().slug(slug).name(slug).description("Description")
                .position(position).status(status).createdAt(now).updatedAt(now).build());
    }

    private User user(String email) {
        Instant now = Instant.now();
        return users.save(User.builder().name("Author").email(email).passwordHash("hash").createdAt(now)
                .updatedAt(now).build());
    }

    private ForumTopic topic(ForumCategory category, User author, String title, ForumTopicStatus status,
            Instant activity) {
        return topics.save(ForumTopic.builder().category(category).author(author).title(title).status(status)
                .pinned(false).locked(false).postsCount(1).createdAt(activity).updatedAt(activity)
                .lastActivityAt(activity).build());
    }

    private ForumPost savePost(ForumTopic topic, User author, String content, Instant createdAt) {
        return posts.save(ForumPost.builder().topic(topic).author(author).content(content)
                .status(ForumPostStatus.ACTIVE).createdAt(createdAt).updatedAt(createdAt).build());
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Author\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
