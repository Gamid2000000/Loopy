package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardImportRowRequest {
	private int rowNumber;
	private String front;
	private String back;
	private String example;
	private String note;
}
