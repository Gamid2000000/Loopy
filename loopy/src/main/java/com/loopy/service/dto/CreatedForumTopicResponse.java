package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreatedForumTopicResponse {
    private Long topicId;
    private Long firstPostId;
    private String categorySlug;
    private String title;
    private Instant createdAt;
}
