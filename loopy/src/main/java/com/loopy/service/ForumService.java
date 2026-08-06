package com.loopy.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.ForumException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.User;
import com.loopy.model.enumeration.ForumCategoryStatus;
import com.loopy.model.enumeration.ForumPostStatus;
import com.loopy.model.enumeration.ForumTopicStatus;
import com.loopy.model.ForumCategory;
import com.loopy.model.ForumPost;
import com.loopy.model.ForumTopic;
import com.loopy.repository.UserRepository;
import com.loopy.repository.ForumCategoryRepository;
import com.loopy.repository.ForumPostRepository;
import com.loopy.repository.ForumTopicRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.AuthService;
import com.loopy.service.dto.CreateForumPostRequest;
import com.loopy.service.dto.CreateForumTopicRequest;
import com.loopy.service.dto.CreatedForumPostResponse;
import com.loopy.service.dto.CreatedForumTopicResponse;
import com.loopy.service.dto.ForumCategoryResponse;
import com.loopy.service.dto.ForumPostResponse;
import com.loopy.service.dto.ForumTopicResponse;
import com.loopy.service.dto.ForumTopicSummaryResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ForumService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final ForumCategoryRepository categoryRepository;

    private final ForumTopicRepository topicRepository;

    private final ForumPostRepository postRepository;

    private final UserRepository userRepository;

    private final ForumContentNormalizer normalizer;

    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ForumCategoryResponse> getCategories() {
        return topicRepository.findPublicCategories(ForumCategoryStatus.ACTIVE, ForumTopicStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Page<ForumTopicSummaryResponse> getTopics(String categorySlug, int page, int size) {
        ensureActiveCategory(categorySlug);
        return topicRepository.findPublicTopicSummaries(categorySlug, ForumCategoryStatus.ACTIVE,
                ForumTopicStatus.ACTIVE, topicsPage(page, size));
    }

    @Transactional(readOnly = true)
    public ForumTopicResponse getTopic(Long topicId, int page, int size) {
        ForumTopicResponse topic = topicRepository
                .findPublicTopic(topicId, ForumTopicStatus.ACTIVE, ForumCategoryStatus.ACTIVE)
                .orElseThrow(this::topicNotFound);
        Page<ForumPostResponse> posts = postRepository.findPublicPosts(topicId, ForumPostStatus.ACTIVE,
                postsPage(page, size));
        topic.setPosts(posts);
        return topic;
    }

    @Transactional
    public CreatedForumTopicResponse createTopic(UserPrincipal principal, String categorySlug,
            CreateForumTopicRequest request) {
        ForumCategory category = ensureActiveCategory(categorySlug);
        User author = currentUser(principal);
        String title = requiredTitle(request.getTitle());
        String content = requiredContent(request.getContent());
        Instant now = clock.instant();

        ForumTopic topic = ForumTopic.builder().category(category).author(author).title(title)
                .status(ForumTopicStatus.ACTIVE).pinned(false).locked(false).postsCount(1)
                .createdAt(now).updatedAt(now).lastActivityAt(now).build();
        topicRepository.saveAndFlush(topic);

        ForumPost firstPost = ForumPost.builder().topic(topic).author(author).content(content)
                .status(ForumPostStatus.ACTIVE).createdAt(now).updatedAt(now).build();
        postRepository.saveAndFlush(firstPost);

        return new CreatedForumTopicResponse(topic.getId(), firstPost.getId(), category.getSlug(), title,
                now);
    }

    @Transactional
    public CreatedForumPostResponse createPost(UserPrincipal principal, Long topicId,
            CreateForumPostRequest request) {
        ForumTopic topic = topicRepository.findByIdForUpdate(topicId).orElseThrow(this::topicNotFound);
        ensureReplyAllowed(topic);
        User author = currentUser(principal);
        String content = requiredContent(request.getContent());
        Instant now = clock.instant();

        ForumPost post = ForumPost.builder().topic(topic).author(author).content(content)
                .status(ForumPostStatus.ACTIVE).createdAt(now).updatedAt(now).build();
        postRepository.saveAndFlush(post);

        topic.setPostsCount(topic.getPostsCount() + 1);
        topic.setUpdatedAt(now);
        topic.setLastActivityAt(now);

        return new CreatedForumPostResponse(post.getId(), topic.getId(), topic.getPostsCount(), now);
    }

    private ForumCategory ensureActiveCategory(String slug) {
        return categoryRepository.findBySlug(slug).filter(category -> category.getStatus() == ForumCategoryStatus.ACTIVE)
                .orElseThrow(this::categoryNotFound);
    }

    private void ensureReplyAllowed(ForumTopic topic) {
        if (topic.getStatus() != ForumTopicStatus.ACTIVE
                || topic.getCategory().getStatus() != ForumCategoryStatus.ACTIVE) {
            throw topicNotFound();
        }
        if (topic.isLocked()) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_LOCKED.getMessage());
        }
    }

    private User currentUser(UserPrincipal principal) {
        return userRepository.findByEmail(AuthService.normalizeEmail(principal.getEmail()))
                .orElseThrow(this::topicNotFound);
    }

    private String requiredTitle(String title) {
        String normalized = normalizer.normalizeTitle(title);
        if (normalized == null || normalized.length() < 5 || normalized.length() > 160
                || normalizer.containsHtmlTag(normalized)) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_TITLE_INVALID.getMessage());
        }
        return normalized;
    }

    private String requiredContent(String content) {
        String normalized = normalizer.normalizeContent(content);
        if (normalized == null || normalized.length() < 10 || normalized.length() > 10000) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_POST_CONTENT_INVALID.getMessage());
        }
        return normalized;
    }

    private Pageable topicsPage(int page, int size) {
        return PageRequest.of(page, size == 0 ? DEFAULT_PAGE_SIZE : size);
    }

    private Pageable postsPage(int page, int size) {
        return PageRequest.of(page, size == 0 ? DEFAULT_PAGE_SIZE : size);
    }

    private ForumException categoryNotFound() {
        return new ForumException(HttpResponseMessage.HTTP_FORUM_CATEGORY_NOT_FOUND.getMessage());
    }

    private ForumException topicNotFound() {
        return new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_NOT_FOUND.getMessage());
    }
}
