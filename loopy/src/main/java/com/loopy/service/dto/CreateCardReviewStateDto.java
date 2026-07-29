package com.loopy.service.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardReviewStateDto {
    private Long userId;
    private Long cardId;
    private Double easinessFactor;
    private Integer intervalDays;
    private Integer consecutiveCorrectCount;
    private Instant dueAt;
}
