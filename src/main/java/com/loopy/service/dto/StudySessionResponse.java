package com.loopy.service.dto;

import java.time.Instant;
import com.loopy.model.enumeration.StudySessionStatus;
import lombok.*;

@Data @AllArgsConstructor
public class StudySessionResponse {
    private Long id; private Long deckId; private String deckName; private StudySessionStatus status;
    private int reviewCardsCount; private int newCardsCount; private int totalCardsCount;
    private Integer currentPosition; private long remainingCardsCount;
    private Instant startedAt; private Instant completedAt; private Instant cancelledAt;
}
