package com.loopy.service.dto;

import java.time.Instant;

import lombok.Data;

@Data
public class ForumPostResponse {
    private Long id;
    private ForumAuthorResponse author;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean edited;

    public ForumPostResponse(Long id, Long authorId, String authorName, String content,
            Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.author = new ForumAuthorResponse(authorId, authorName);
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.edited = updatedAt.isAfter(createdAt);
    }
}
