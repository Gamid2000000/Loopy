package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StudyAvailabilityResponse {
    private long dueReviewCardsCount;
    private long newCardsCount;
    private long reviewCardsQueuedToday;
    private long newCardsQueuedToday;
    private int dailyReviewLimit;
    private int dailyNewCardsLimit;
    private int remainingReviewLimit;
    private int remainingNewLimit;
    private long availableReviewCardsCount;
    private long availableNewCardsCount;
}
