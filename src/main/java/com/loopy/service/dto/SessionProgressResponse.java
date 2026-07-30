package com.loopy.service.dto;

import com.loopy.model.enumeration.StudySessionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SessionProgressResponse {
    private Long id;
    private StudySessionStatus status;
    private Integer currentPosition;
    private int reviewedCardsCount;
    private long remainingCardsCount;
    private int totalCardsCount;
}
