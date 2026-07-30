package com.loopy.service.dto;

import java.util.UUID;

import com.loopy.model.enumeration.ReviewGrade;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubmitReviewRequest {

    @NotNull
    private Long sessionCardId;

    @NotNull
    private ReviewGrade grade;

    @PositiveOrZero
    @Max(86_400_000L)
    private Long responseTimeMs;

    @NotNull
    private UUID clientReviewId;
}
