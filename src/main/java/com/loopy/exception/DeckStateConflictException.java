package com.loopy.exception;

public class DeckStateConflictException extends RuntimeException {
	public DeckStateConflictException(String message) {
		super(message);
	}
}
