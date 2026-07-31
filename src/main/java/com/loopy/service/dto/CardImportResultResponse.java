package com.loopy.service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardImportResultResponse {
	private int requestedRows;
	private int importedRows;
	private int skippedDuplicateRows;
	private List<ImportedCardResponse> cards;
}
