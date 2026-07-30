package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActiveStudySessionResponse {
    private Long sessionId;
    private Long deckId;
    private String deckName;
    private int completedCardsCount;
    private int totalCardsCount;
    private Instant startedAt;
    private int currentPosition;

    public long getRemainingCardsCount() {
        return totalCardsCount - completedCardsCount;
    }
}
