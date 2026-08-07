package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DeletedForumPostResponse {

    private Long postId;

    private Long topicId;

    private long postsCount;

    private Instant lastActivityAt;
}
