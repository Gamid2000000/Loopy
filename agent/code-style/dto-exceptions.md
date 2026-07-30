# DTO & Exception Rules

## DTOs

All DTOs must use Lombok `@Data` + `@AllArgsConstructor` format. No Java `record` types for DTOs.

```java
// CORRECT
@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private long expiresIn;
}

// INCORRECT
public record AuthResponse(String accessToken, String tokenType, long expiresIn) {}
```

## Exceptions

All custom exceptions must extend `RuntimeException` with only a `String message` constructor calling `super(message)`. No extra fields, no no-arg constructors.

```java
public class CardNotFoundException extends RuntimeException {
    public CardNotFoundException(String message) {
        super(message);
    }
}
```

All exception messages must come from `HttpResponseMessage` enum:

```java
// CORRECT
throw new CardNotFoundException(HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage());

// INCORRECT
throw new CardNotFoundException("Card not found");
```

Prefer existing custom exceptions from `com.loopy.exception` for API consistency.
