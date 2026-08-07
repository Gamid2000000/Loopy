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
	HTTP_CARD_STATE_NOT_FOUND("Card state not found"),
	HTTP_CARD_ARCHIVED("Archived card cannot be changed"),
	HTTP_CARD_ALREADY_ARCHIVED("Card is already archived"),
	HTTP_CARD_ALREADY_ACTIVE("Card is already active"),
	HTTP_CARD_UPDATE_EMPTY("Card update must contain at least one field"),
	HTTP_CARD_REVIEW_STATE_ALREADY_EXISTS("Card review state already exists"),
	HTTP_CARD_REVIEW_STATE_CREATION_FAILED("Card review state creation failed"),
	HTTP_DECK_ARCHIVED("Archived deck cannot be changed"),
	HTTP_STUDY_SESSION_NOT_FOUND("Study session was not found"),
	HTTP_STUDY_SESSION_ALREADY_ACTIVE("An active study session already exists for this deck"),
	HTTP_STUDY_SESSION_NOT_ACTIVE("Study session is not active"),
	HTTP_STUDY_SESSION_ALREADY_CANCELLED("Study session is already cancelled"),
	HTTP_STUDY_SESSION_ALREADY_COMPLETED("Study session is already completed"),
	HTTP_STUDY_SESSION_CARD_NOT_CURRENT("Study session card is not the current pending card"),
	HTTP_REVIEW_IDEMPOTENCY_CONFLICT("Review idempotency key was already used with different data"),
	HTTP_NO_CARDS_AVAILABLE("No cards available for study"),
	HTTP_INVALID_USER_TIMEZONE("User timezone is invalid"),

	// Card Import
	HTTP_CARD_IMPORT_EMPTY("Card import request is empty"),
	HTTP_CARD_IMPORT_TOO_MANY_ROWS("Too many rows for import"),
	HTTP_CARD_IMPORT_NO_VALID_ROWS("No valid rows to import"),
	HTTP_CARD_IMPORT_INVALID_ROW("Card import row is invalid"),

	// Forum
	HTTP_FORUM_CATEGORY_NOT_FOUND("Forum category was not found"),
	HTTP_FORUM_TOPIC_NOT_FOUND("Forum topic was not found"),
	HTTP_FORUM_TOPIC_LOCKED("Forum topic is locked"),
	HTTP_FORUM_TOPIC_TITLE_INVALID("Forum topic title is invalid"),
	HTTP_FORUM_POST_CONTENT_INVALID("Forum post content is invalid"),
	HTTP_FORUM_POST_NOT_FOUND("Forum post was not found"),
	HTTP_FORUM_TOPIC_FORBIDDEN("Forum topic forbidden"),
	HTTP_FORUM_POST_FORBIDDEN("Forum post forbidden"),
	HTTP_FORUM_CONTENT_VERSION_CONFLICT("Forum content was modified in another tab"),
	HTTP_FORUM_FIRST_POST_DELETE_FORBIDDEN("Forum first post cannot be deleted separately");

	private final String message;

	HttpResponseMessage(String message) {
		this.message = message;
	}
}
