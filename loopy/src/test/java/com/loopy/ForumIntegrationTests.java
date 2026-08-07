package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
        assertThat(sessionFactory.getStatistics().getQueryExecutionCount()).isLessThanOrEqualTo(4);
    }

    // ========================================
    // Edit topic
    // ========================================

    @Test
    void editTopicRequiresAuth() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCanEditTopicTitle() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);
        long originalPostsCount = topic.getPostsCount();
        Instant originalLastActivity = topic.getLastActivityAt();

        String result = mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("  Updated title  ", topic.getVersion())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"))
                .andExpect(jsonPath("$.version").isNumber())
                .andReturn().getResponse().getContentAsString();

        long returnedVersion = Long.parseLong(result.replaceFirst(".*\"version\":(\\d+).*", "$1"));
        assertThat(returnedVersion).isGreaterThan(topic.getVersion());

        ForumTopic updated = topics.findById(topic.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Updated title");
        assertThat(updated.getUpdatedAt()).isAfter(updated.getCreatedAt());
        assertThat(updated.getPostsCount()).isEqualTo(originalPostsCount);
        assertThat(updated.getLastActivityAt().toEpochMilli()).isEqualTo(originalLastActivity.toEpochMilli());
    }

    @Test
    void foreignUserCannotEditTopic() throws Exception {
        User author = user("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String foreignToken = register("foreign@example.com");

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + foreignToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_FORBIDDEN"));
    }

    @Test
    void editTopicReturnsNotFoundForDeletedTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.DELETED, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isNotFound());
    }

    @Test
    void editTopicReturnsNotFoundForHiddenTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.HIDDEN, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isNotFound());
    }

    @Test
    void editTopicReturnsNotFoundForHiddenCategory() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("hidden", ForumCategoryStatus.HIDDEN, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotEditLockedTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        topic.setLocked(true);
        topics.save(topic);
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", topic.getVersion())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_LOCKED"));
    }

    @Test
    void editTopicWithBlankTitleFails() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("   ", topic.getVersion())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editTopicWithHtmlTitleFails() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("<b>HTML title</b>", topic.getVersion())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_TITLE_INVALID"));
    }

    @Test
    void editTopicWithStaleVersionReturnsConflict() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        long staleVersion = topic.getVersion() + 1;
        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Updated title", staleVersion)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_CONTENT_VERSION_CONFLICT"));
    }

    @Test
    void editTopicConcurrentVersionConflict() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);
        Long originalVersion = topic.getVersion();

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("First edit", originalVersion)))
                .andExpect(status().isOk());

        mvc.perform(patch("/forum/topics/{id}", topic.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonTopic("Second edit", originalVersion)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_CONTENT_VERSION_CONFLICT"));
    }

    // ========================================
    // Edit post
    // ========================================

    @Test
    void editPostRequiresAuth() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated content valid", post.getVersion())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCanEditReply() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "first valid content", Instant.parse("2026-08-01T10:00:00Z"));
        ForumPost reply = savePost(topic, author, "reply valid content",
                Instant.parse("2026-08-01T11:00:00Z"));
        String token = tokenFor(author);

        String result = mvc.perform(patch("/forum/posts/{id}", reply.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("  Updated\r\nreply content  ", reply.getVersion())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated\nreply content"))
                .andExpect(jsonPath("$.edited").value(true))
                .andExpect(jsonPath("$.version").isNumber())
                .andReturn().getResponse().getContentAsString();

        long returnedVersion = Long.parseLong(result.replaceFirst(".*\"version\":(\\d+).*", "$1"));
        assertThat(returnedVersion).isGreaterThan(reply.getVersion());
    }

    @Test
    void ownerCanEditFirstPost() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost firstPost = savePost(topic, author, "first valid content", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/posts/{id}", firstPost.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated first post content", firstPost.getVersion())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.edited").value(true));
    }

    @Test
    void editPostDoesNotChangeTopicActivity() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE,
                Instant.parse("2026-08-01T10:00:00Z"));
        ForumPost firstPost = savePost(topic, author, "first valid content",
                Instant.parse("2026-08-01T10:00:00Z"));
        long originalPostsCount = topic.getPostsCount();
        Instant originalLastActivity = topic.getLastActivityAt();
        String token = tokenFor(author);

        mvc.perform(patch("/forum/posts/{id}", firstPost.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated first post content", firstPost.getVersion())))
                .andExpect(status().isOk());

        ForumTopic updated = topics.findById(topic.getId()).orElseThrow();
        assertThat(updated.getPostsCount()).isEqualTo(originalPostsCount);
        assertThat(updated.getLastActivityAt()).isEqualTo(originalLastActivity);
    }

    @Test
    void foreignUserCannotEditPost() throws Exception {
        User author = user("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());
        String foreignToken = register("foreign@example.com");

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + foreignToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated content valid", post.getVersion())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORUM_POST_FORBIDDEN"));
    }

    @Test
    void cannotEditPostInLockedTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        topic.setLocked(true);
        topics.save(topic);
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated content valid", post.getVersion())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_LOCKED"));
    }

    @Test
    void editPostWithInvalidContent() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("short", post.getVersion())))
                .andExpect(status().isBadRequest());

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("", post.getVersion())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editPostWithStaleVersionReturnsConflict() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        long staleVersion = post.getVersion() + 1;
        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("Updated content valid", staleVersion)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_CONTENT_VERSION_CONFLICT"));
    }

    @Test
    void editPostScriptTagIsStoredAsPlainText() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost post = savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(patch("/forum/posts/{id}", post.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPost("<script>alert(\"edited\")</script>more content", post.getVersion())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("<script>alert(\"edited\")</script>more content"));
    }

    // ========================================
    // Delete topic
    // ========================================

    @Test
    void deleteTopicRequiresAuth() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());

        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), topic.getVersion()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCanSoftDeleteTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        ForumPost reply = savePost(topic, author, "another valid reply", Instant.now());
        String token = tokenFor(author);
        Long version = topic.getVersion();

        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), version)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        ForumTopic deleted = topics.findById(topic.getId()).orElseThrow();
        assertThat(deleted.getStatus()).isEqualTo(ForumTopicStatus.DELETED);

        assertThat(posts.findById(reply.getId())).isPresent();
        assertThat(posts.findById(reply.getId()).orElseThrow().getStatus()).isEqualTo(ForumPostStatus.ACTIVE);

        mvc.perform(get("/forum/topics/{id}", topic.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_NOT_FOUND"));

        mvc.perform(get("/forum/categories/general/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void foreignUserCannotDeleteTopic() throws Exception {
        User author = user("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String foreignToken = register("foreign@example.com");

        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), topic.getVersion())
                .header("Authorization", "Bearer " + foreignToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_FORBIDDEN"));
    }

    @Test
    void cannotDeleteLockedTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        topic.setLocked(true);
        topics.save(topic);
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), topic.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_LOCKED"));
    }

    @Test
    void deleteTopicWithStaleVersionReturnsConflict() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        long staleVersion = topic.getVersion() + 1;
        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), staleVersion)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_CONTENT_VERSION_CONFLICT"));
    }

    @Test
    void doubleDeleteTopicReturnsNotFound() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Original title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());
        String token = tokenFor(author);

        Long version = topic.getVersion();
        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), version)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        Long newVersion = topics.findById(topic.getId()).orElseThrow().getVersion();
        mvc.perform(delete("/forum/topics/{id}?version={v}", topic.getId(), newVersion)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ========================================
    // Delete post
    // ========================================

    @Test
    void deletePostRequiresAuth() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "first valid content", Instant.now());
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());

        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCanSoftDeleteReply() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "first valid content", Instant.now());
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());
        String token = tokenFor(author);

        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(reply.getId()))
                .andExpect(jsonPath("$.topicId").value(topic.getId()))
                .andExpect(jsonPath("$.postsCount").value(1))
                .andExpect(jsonPath("$.lastActivityAt").exists());

        assertThat(posts.findById(reply.getId())).isPresent();
        assertThat(posts.findById(reply.getId()).orElseThrow().getStatus()).isEqualTo(ForumPostStatus.DELETED);

        ForumTopic updated = topics.findById(topic.getId()).orElseThrow();
        assertThat(updated.getPostsCount()).isEqualTo(1);
    }

    @Test
    void deleteReplyUpdatesPostsCountAndActivity() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "first valid content",
                Instant.parse("2026-08-01T10:00:00Z"));
        ForumPost reply = savePost(topic, author, "reply valid content",
                Instant.parse("2026-08-01T11:00:00Z"));
        String token = tokenFor(author);

        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postsCount").value(1))
                .andExpect(jsonPath("$.lastActivityAt").value("2026-08-01T10:00:00Z"));
    }

    @Test
    void foreignUserCannotDeletePost() throws Exception {
        User author = user("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());
        String foreignToken = register("foreign@example.com");

        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion())
                .header("Authorization", "Bearer " + foreignToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORUM_POST_FORBIDDEN"));
    }

    @Test
    void cannotDeleteFirstPost() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost firstPost = savePost(topic, author, "first valid content", Instant.now());
        String token = tokenFor(author);

        mvc.perform(delete("/forum/posts/{id}?version={v}", firstPost.getId(), firstPost.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_FIRST_POST_DELETE_FORBIDDEN"));
    }

    @Test
    void cannotDeletePostInLockedTopic() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        topic.setLocked(true);
        topics.save(topic);
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());
        String token = tokenFor(author);

        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_TOPIC_LOCKED"));
    }

    @Test
    void deletePostWithStaleVersionReturnsConflict() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());
        String token = tokenFor(author);

        long staleVersion = reply.getVersion() + 1;
        mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), staleVersion)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("FORUM_CONTENT_VERSION_CONFLICT"));
    }

    @Test
    void deletePostReturnsNotFoundForDeletedPost() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost deletedPost = savePostBuild(topic, author, "was deleted", Instant.now(),
                ForumPostStatus.DELETED);
        String token = tokenFor(author);

        mvc.perform(delete("/forum/posts/{id}?version={v}", deletedPost.getId(), deletedPost.getVersion())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ========================================
    // Version exposed in GET responses
    // ========================================

    @Test
    void topicResponseIncludesVersionAndFirstPostId() throws Exception {
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        User author = user("author@example.com");
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        ForumPost firstPost = savePost(topic, author, "first valid content", Instant.now());
        savePost(topic, author, "second valid content", Instant.now());

        mvc.perform(get("/forum/topics/{id}", topic.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").isNumber())
                .andExpect(jsonPath("$.firstPostId").value(firstPost.getId()));
    }

    @Test
    void postResponseIncludesVersion() throws Exception {
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        User author = user("author@example.com");
        ForumTopic topic = topic(cat, author, "Topic title", ForumTopicStatus.ACTIVE, Instant.now());
        savePost(topic, author, "valid content here", Instant.now());

        mvc.perform(get("/forum/topics/{id}", topic.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posts.content[0].version").isNumber());
    }

    // ========================================
    // Delete reply + concurrent reply
    // ========================================

    @Test
    void deleteReplyConcurrentWithNewReplyHasConsistentState() throws Exception {
        User author = registeredUser("author@example.com");
        ForumCategory cat = category("general", ForumCategoryStatus.ACTIVE, 0);
        String token = tokenFor(author);
        ForumTopic topic = topics.save(ForumTopic.builder().category(cat).author(author)
                .title("Topic title").status(ForumTopicStatus.ACTIVE).pinned(false).locked(false)
                .postsCount(2).createdAt(Instant.now()).updatedAt(Instant.now())
                .lastActivityAt(Instant.now()).build());
        savePost(topic, author, "first valid content", Instant.now());
        ForumPost reply = savePost(topic, author, "reply valid content", Instant.now());

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> deleteFuture = executor.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    mvc.perform(delete("/forum/posts/{id}?version={v}", reply.getId(), reply.getVersion())
                            .header("Authorization", "Bearer " + token));
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                } catch (Exception ignored) {
                }
            });
            Future<?> replyFuture = executor.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    forumService.createPost(new UserPrincipal(author.getEmail(), "test"), topic.getId(),
                            new CreateForumPostRequest("concurrent reply text"));
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                } catch (Exception ignored) {
                }
            });
            ready.await();
            start.countDown();
            deleteFuture.get();
            replyFuture.get();
        } finally {
            executor.shutdownNow();
        }

        ForumTopic updated = topics.findById(topic.getId()).orElseThrow();
        long activeCount = posts.findAll().stream()
                .filter(p -> p.getStatus() == ForumPostStatus.ACTIVE && p.getTopic().getId().equals(topic.getId()))
                .count();
        assertThat(updated.getPostsCount()).isEqualTo(activeCount);
    }

    // ========================================
    // Helpers
    // ========================================

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
        return savePostBuild(topic, author, content, createdAt, ForumPostStatus.ACTIVE);
    }

    private ForumPost savePostBuild(ForumTopic topic, User author, String content, Instant createdAt,
            ForumPostStatus status) {
        return posts.save(ForumPost.builder().topic(topic).author(author).content(content)
                .status(status).createdAt(createdAt).updatedAt(createdAt).build());
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Author\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }

    private User registeredUser(String email) throws Exception {
        register(email);
        return users.findByEmail(email).orElseThrow();
    }

    private String tokenFor(User user) throws Exception {
        String body = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"password1\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }

    private String jsonTopic(String title, Long version) {
        return "{\"title\":\"" + title + "\",\"version\":" + version + "}";
    }

    private String jsonPost(String content, Long version) {
        String escaped = content.replace("\\", "\\\\").replace("\n", "\\n")
                .replace("\r", "\\r").replace("\"", "\\\"");
        return "{\"content\":\"" + escaped + "\",\"version\":" + version + "}";
    }
}
