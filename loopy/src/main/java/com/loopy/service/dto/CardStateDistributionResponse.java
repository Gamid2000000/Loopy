package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardStateDistributionResponse {
    private long activeCardsCount;
    private long newCardsCount;
    private long dueCardsCount;
    private long scheduledCardsCount;
}
