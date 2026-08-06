package com.loopy.service.dto;

import java.time.Instant;

import lombok.Data;

@Data
public class ForumTopicSummaryResponse {
    private Long id;
    private String categorySlug;
    private String title;
    private ForumAuthorResponse author;
    private boolean pinned;
    private boolean locked;
    private long postsCount;
    private Instant createdAt;
    private Instant lastActivityAt;

    public ForumTopicSummaryResponse(Long id, String categorySlug, String title, Long authorId,
            String authorName, boolean pinned, boolean locked, long postsCount, Instant createdAt,
            Instant lastActivityAt) {
        this.id = id;
        this.categorySlug = categorySlug;
        this.title = title;
        this.author = new ForumAuthorResponse(authorId, authorName);
        this.pinned = pinned;
        this.locked = locked;
        this.postsCount = postsCount;
        this.createdAt = createdAt;
        this.lastActivityAt = lastActivityAt;
    }
}
