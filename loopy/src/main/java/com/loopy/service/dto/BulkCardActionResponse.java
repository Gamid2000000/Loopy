package com.loopy.service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BulkCardActionResponse {
    private int requestedCount;
    private int changedCount;
    private int unchangedCount;
    private List<Long> changedCardIds;
    private List<Long> unchangedCardIds;
}
