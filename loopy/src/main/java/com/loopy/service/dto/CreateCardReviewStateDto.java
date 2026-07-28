package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardReviewStateDto {

	private Long userId;
	private Long cardId;
	private Short easinessFactor;
	private Short interval;
	private Short counsecutiveCorrectCount;
	private Short dueAt;
}
