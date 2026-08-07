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
import com.loopy.service.dto.DeletedForumPostResponse;
import com.loopy.service.dto.ForumCategoryResponse;
import com.loopy.service.dto.ForumPostResponse;
import com.loopy.service.dto.ForumTopicResponse;
import com.loopy.service.dto.ForumTopicSummaryResponse;
import com.loopy.service.dto.UpdateForumPostRequest;
import com.loopy.service.dto.UpdateForumTopicRequest;
import com.loopy.service.dto.UpdatedForumPostResponse;
import com.loopy.service.dto.UpdatedForumTopicResponse;

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
        topic.setFirstPostId(postRepository.findFirstActivePostId(topicId, ForumPostStatus.ACTIVE).orElse(null));
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

    @Transactional
    public UpdatedForumTopicResponse updateTopic(UserPrincipal principal, Long topicId,
            UpdateForumTopicRequest request) {
        ForumTopic topic = topicRepository.findById(topicId).orElseThrow(this::topicNotFound);
        ensureTopicMutable(topic);
        User currentUser = currentUser(principal);
        ensureTopicOwner(topic, currentUser);
        ensureVersion(topic, request.getVersion());

        String title = requiredTitle(request.getTitle());
        Instant now = clock.instant();

        topic.setTitle(title);
        topic.setUpdatedAt(now);
        topic = topicRepository.saveAndFlush(topic);

        return new UpdatedForumTopicResponse(topic.getId(), topic.getTitle(), now, topic.getVersion());
    }

    @Transactional
    public UpdatedForumPostResponse updatePost(UserPrincipal principal, Long postId,
            UpdateForumPostRequest request) {
        ForumPost post = postRepository.findById(postId).orElseThrow(this::postNotFound);
        ForumTopic topic = post.getTopic();

        ensurePostMutable(post, topic);
        User currentUser = currentUser(principal);
        ensurePostOwner(post, currentUser);
        ensureVersion(post, request.getVersion());

        String content = requiredContent(request.getContent());
        Instant now = clock.instant();

        post.setContent(content);
        post.setUpdatedAt(now);
        post = postRepository.saveAndFlush(post);

        return new UpdatedForumPostResponse(post.getId(), post.getContent(), now,
                post.getUpdatedAt().isAfter(post.getCreatedAt()), post.getVersion());
    }

    @Transactional
    public void deleteTopic(UserPrincipal principal, Long topicId, Long version) {
        ForumTopic topic = topicRepository.findByIdForUpdate(topicId).orElseThrow(this::topicNotFound);
        ensureTopicMutable(topic);
        User currentUser = currentUser(principal);
        ensureTopicOwner(topic, currentUser);
        ensureVersion(topic, version);

        topic.setStatus(ForumTopicStatus.DELETED);
        topic.setUpdatedAt(clock.instant());
    }

    @Transactional
    public DeletedForumPostResponse deletePost(UserPrincipal principal, Long postId, Long version) {
        ForumPost lookupPost = postRepository.findById(postId).orElseThrow(this::postNotFound);
        Long topicId = lookupPost.getTopic().getId();

        ForumTopic topic = topicRepository.findByIdForUpdate(topicId).orElseThrow(this::topicNotFound);

        if (topic.getStatus() != ForumTopicStatus.ACTIVE
                || topic.getCategory().getStatus() != ForumCategoryStatus.ACTIVE) {
            throw topicNotFound();
        }
        if (topic.isLocked()) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_LOCKED.getMessage());
        }

        ForumPost post = postRepository.findByIdForUpdate(postId).orElseThrow(this::postNotFound);

        if (post.getStatus() != ForumPostStatus.ACTIVE) {
            throw postNotFound();
        }

        User currentUser = currentUser(principal);
        ensurePostOwner(post, currentUser);
        ensureVersion(post, version);

        ensureNotFirstPost(post, topic);

        post.setStatus(ForumPostStatus.DELETED);
        post.setUpdatedAt(clock.instant());

        postRepository.flush();

        java.util.List<Object[]> aggregate = postRepository.aggregateActivePosts(topic.getId(), ForumPostStatus.ACTIVE);
        long newPostsCount = aggregate.isEmpty() ? 0 : ((Number) aggregate.get(0)[0]).longValue();
        Instant lastActivityAt = aggregate.isEmpty() ? null : (Instant) aggregate.get(0)[1];

        topic.setPostsCount(newPostsCount);
        topic.setLastActivityAt(lastActivityAt != null ? lastActivityAt : topic.getCreatedAt());

        return new DeletedForumPostResponse(post.getId(), topic.getId(), newPostsCount, topic.getLastActivityAt());
    }

    private void ensureTopicMutable(ForumTopic topic) {
        if (topic.getStatus() != ForumTopicStatus.ACTIVE
                || topic.getCategory().getStatus() != ForumCategoryStatus.ACTIVE) {
            throw topicNotFound();
        }
        if (topic.isLocked()) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_LOCKED.getMessage());
        }
    }

    private void ensurePostMutable(ForumPost post, ForumTopic topic) {
        if (post.getStatus() != ForumPostStatus.ACTIVE) {
            throw postNotFound();
        }
        if (topic.getStatus() != ForumTopicStatus.ACTIVE
                || topic.getCategory().getStatus() != ForumCategoryStatus.ACTIVE) {
            throw topicNotFound();
        }
        if (topic.isLocked()) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_LOCKED.getMessage());
        }
    }

    private void ensureTopicOwner(ForumTopic topic, User user) {
        if (!topic.getAuthor().getId().equals(user.getId())) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_TOPIC_FORBIDDEN.getMessage());
        }
    }

    private void ensurePostOwner(ForumPost post, User user) {
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_POST_FORBIDDEN.getMessage());
        }
    }

    private void ensureVersion(ForumTopic topic, Long expectedVersion) {
        if (!topic.getVersion().equals(expectedVersion)) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_CONTENT_VERSION_CONFLICT.getMessage());
        }
    }

    private void ensureVersion(ForumPost post, Long expectedVersion) {
        if (!post.getVersion().equals(expectedVersion)) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_CONTENT_VERSION_CONFLICT.getMessage());
        }
    }

    private void ensureNotFirstPost(ForumPost post, ForumTopic topic) {
        Long firstPostId = postRepository.findFirstActivePostId(topic.getId(), ForumPostStatus.ACTIVE).orElse(null);
        if (firstPostId != null && firstPostId.equals(post.getId())) {
            throw new ForumException(HttpResponseMessage.HTTP_FORUM_FIRST_POST_DELETE_FORBIDDEN.getMessage());
        }
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

    private ForumException postNotFound() {
        return new ForumException(HttpResponseMessage.HTTP_FORUM_POST_NOT_FOUND.getMessage());
    }
}
