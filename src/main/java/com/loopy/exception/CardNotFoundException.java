package com.loopy.exception;

public class CardNotFoundException extends RuntimeException {
	public CardNotFoundException(String message) {
		super(message);
	}
}
