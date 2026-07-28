package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileResponse {

	private String displayName;
	private String nativeLanguage;
	private String learningLanguage;
	private String timezone;
	private int dailyNewCardsLimit;
	private int dailyReviewLimit;
}
