package com.loopy.service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CardImportPreviewRowResponse {
	private int rowNumber;
	private String front;
	private String back;
	private String example;
	private String note;
	private CardImportRowStatus status;
	private List<String> errors;
}
