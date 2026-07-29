package com.loopy.service.dto;

import java.time.Instant;
import com.loopy.model.enumeration.CardStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardSummaryResponse {
    private Long id;
    private String front;
    private String back;
    private CardStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
