package com.loopy.service.dto;

import java.time.Instant;

import com.loopy.model.enumeration.ReviewGrade;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReviewResultResponse {
    private Long reviewLogId;
    private Long cardId;
    private ReviewGrade grade;
    private int sm2Score;
    private Double previousEaseFactor;
    private Double newEaseFactor;
    private Integer previousIntervalDays;
    private Integer newIntervalDays;
    private Integer previousConsecutiveCorrectCount;
    private Integer newConsecutiveCorrectCount;
    private Instant previousDueAt;
    private Instant nextReviewAt;
    private Instant reviewedAt;
}
