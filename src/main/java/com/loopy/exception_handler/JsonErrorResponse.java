package com.loopy.exception_handler;

public record JsonErrorResponse(String code, String message, int status) { }
