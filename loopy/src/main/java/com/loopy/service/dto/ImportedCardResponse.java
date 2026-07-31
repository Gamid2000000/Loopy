package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImportedCardResponse {
	private int rowNumber;
	private Long cardId;
	private String front;
	private String back;
}
