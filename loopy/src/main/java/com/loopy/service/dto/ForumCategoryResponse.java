package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ForumCategoryResponse {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private long topicsCount;
    private Instant lastActivityAt;
}
