package com.loopy.service.dto;

import java.time.Duration;
import java.time.Instant;

import com.loopy.model.enumeration.StudySessionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecentStudySessionResponse {
    private Long sessionId;
    private Long deckId;
    private String deckName;
    private StudySessionStatus status;
    private int completedCardsCount;
    private int totalCardsCount;
    private Instant startedAt;
    private Instant completedAt;

    public long getDurationSeconds() {
        return Duration.between(startedAt, completedAt).toSeconds();
    }
}
