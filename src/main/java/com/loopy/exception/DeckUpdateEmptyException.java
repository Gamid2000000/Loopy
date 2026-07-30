package com.loopy.exception;

public class DeckUpdateEmptyException extends RuntimeException {
	public DeckUpdateEmptyException(String message) {
		super(message);
	}
}
