package com.loopy.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardRequest {
	@NotBlank(message = "Card front is required")
	@Size(max = 500, message = "Card front must not exceed 500 characters")
	private String front;
	@NotBlank(message = "Card back is required")
	@Size(max = 2000, message = "Card back must not exceed 2000 characters")
	private String back;
	@Size(max = 3000, message = "Card example must not exceed 3000 characters")
	private String example;
	@Size(max = 3000, message = "Card note must not exceed 3000 characters")
	private String note;
}
