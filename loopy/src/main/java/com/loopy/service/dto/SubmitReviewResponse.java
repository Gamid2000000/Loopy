package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubmitReviewResponse {
    private ReviewResultResponse review;
    private SessionProgressResponse session;
    private CurrentStudyCardResponse nextCard;
}
