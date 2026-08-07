package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdatedForumPostResponse {

    private Long id;

    private String content;

    private Instant updatedAt;

    private boolean edited;

    private Long version;
}
