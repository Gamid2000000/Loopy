package com.loopy.exception_handler.enumeration;

import lombok.Getter;

@Getter
public enum HttpResponseMessage {

	// Authorization and validation data
	HTTP_INVALID_JWT_RESPONSE_MESSAGE("JWT token not valid or missing!"),
	HTTP_INVALID_EMAIL_OR_PASSWORD("Invalid email or password"),

	// User
	HTTP_USER_ALREADY_EXIST("User already exist"),
	HTTP_USER_NOT_FOUND("User not found"),
	HTTP_USER_PROFILE_NOT_FOUND("User profile not found"),

	// Deck
	HTTP_DECK_NOT_FOUND("Deck was not found"),
	HTTP_DECK_UPDATE_EMPTY("Deck update must contain at least one field"),
	HTTP_DECK_ARCHIVED_CANNOT_UPDATE("Archived deck cannot be updated"),
	HTTP_DECK_ALREADY_ARCHIVED("Deck is already archived"),
	HTTP_DECK_ALREADY_ACTIVE("Deck is already active"),

	// Card
	HTTP_CARD_NOT_FOUND("Card not found"),
	HTTP_CARD_STATE_NOT_FOUND("Card state not found");

	private final String message;

	HttpResponseMessage(String message) {
		this.message = message;
	}
}
