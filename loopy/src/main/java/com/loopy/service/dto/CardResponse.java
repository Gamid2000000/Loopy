package com.loopy.service.dto;

import java.time.Instant;
import com.loopy.model.enumeration.CardStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private Long deckId;
    private String front;
    private String back;
    private String example;
    private String note;
    private CardStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
