package com.loopy.service.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardImportRequest {
	@NotEmpty(message = "No rows provided")
	private List<CardImportRowRequest> rows;
}
