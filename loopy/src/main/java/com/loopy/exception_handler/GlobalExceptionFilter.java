package com.loopy.exception_handler;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.loopy.exception.DeckNotFoundException;
import com.loopy.exception.DeckStateConflictException;
import com.loopy.exception.DeckUpdateEmptyException;
import com.loopy.exception.EmailAlreadyExistsException;
import com.loopy.exception.InvalidCredentialsException;
import com.loopy.exception.InvalidEmailOrPasswordException;
import com.loopy.exception.UserAlreadyExistException;
import com.loopy.exception.UserNotFoundException;
import com.loopy.exception.UserProfileNotFoundException;

@ControllerAdvice
public class GlobalExceptionFilter {
    @ExceptionHandler(DeckNotFoundException.class)
    public ResponseEntity<JsonErrorResponse> deckNotFound(DeckNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "DECK_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(DeckStateConflictException.class)
    public ResponseEntity<JsonErrorResponse> deckConflict(DeckStateConflictException ex) {
        return error(HttpStatus.CONFLICT, "DECK_STATE_CONFLICT", ex.getMessage());
    }

    @ExceptionHandler(DeckUpdateEmptyException.class)
    public ResponseEntity<JsonErrorResponse> emptyDeckUpdate(DeckUpdateEmptyException ex) {
        return error(HttpStatus.BAD_REQUEST, "DECK_UPDATE_EMPTY", ex.getMessage());
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<JsonErrorResponse> optimisticLock(ObjectOptimisticLockingFailureException ex) {
        return error(HttpStatus.CONFLICT, "OPTIMISTIC_LOCK_CONFLICT", "Deck was modified concurrently");
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, IllegalArgumentException.class})
    public ResponseEntity<JsonErrorResponse> validation(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
    }

    @ExceptionHandler({EmailAlreadyExistsException.class, UserAlreadyExistException.class})
    public ResponseEntity<JsonErrorResponse> emailAlreadyExists(RuntimeException ex) {
        return error(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", ex.getMessage());
    }

    @ExceptionHandler({InvalidCredentialsException.class, InvalidEmailOrPasswordException.class})
    public ResponseEntity<JsonErrorResponse> invalidCredentials(RuntimeException ex) {
        return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", ex.getMessage());
    }

    @ExceptionHandler({UserNotFoundException.class, UserProfileNotFoundException.class})
    public ResponseEntity<JsonErrorResponse> userNotFound(RuntimeException ex) {
        return error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<JsonErrorResponse> integrity(DataIntegrityViolationException ex) {
        return error(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "Data integrity constraint was violated");
    }

    private ResponseEntity<JsonErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new JsonErrorResponse(code, message, status.value()));
    }
}
