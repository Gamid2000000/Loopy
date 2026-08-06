package com.loopy.service.dto;

import java.time.Instant;

import org.springframework.data.domain.Page;

import lombok.Data;

@Data
public class ForumTopicResponse {
    private Long id;
    private ForumCategoryBriefResponse category;
    private String title;
    private ForumAuthorResponse author;
    private boolean pinned;
    private boolean locked;
    private long postsCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastActivityAt;
    private Page<ForumPostResponse> posts;

    public ForumTopicResponse(Long id, Long categoryId, String categorySlug, String categoryName,
            String title, Long authorId, String authorName, boolean pinned, boolean locked,
            long postsCount, Instant createdAt, Instant updatedAt, Instant lastActivityAt,
            Page<ForumPostResponse> posts) {
        this.id = id;
        this.category = new ForumCategoryBriefResponse(categoryId, categorySlug, categoryName);
        this.title = title;
        this.author = new ForumAuthorResponse(authorId, authorName);
        this.pinned = pinned;
        this.locked = locked;
        this.postsCount = postsCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastActivityAt = lastActivityAt;
        this.posts = posts;
    }
}
