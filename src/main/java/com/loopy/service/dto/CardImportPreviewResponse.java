package com.loopy.service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardImportPreviewResponse {
	private int totalRows;
	private int validRows;
	private int invalidRows;
	private int duplicateInFileRows;
	private int duplicateInDeckRows;
	private List<CardImportPreviewRowResponse> rows;
}
