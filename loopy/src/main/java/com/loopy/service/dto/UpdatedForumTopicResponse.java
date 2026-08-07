package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdatedForumTopicResponse {

    private Long id;

    private String title;

    private Instant updatedAt;

    private Long version;
}
