# AGENTS.md

## Scope
- This repository is backend-only (`loopy`) on Java/Spring Boot.
- No React/TypeScript source files were found in this repo (`src/main/java` + `src/test/java` only).

## Tech Stack (from `pom.xml`)
- Java 21.
- Spring Boot 4.1.0 (`webmvc`, `security`, `data-jpa`, `validation`).
- PostgreSQL runtime DB.
- H2 in-memory DB for tests.
- JWT via `jjwt` (0.11.5).
- Lombok (constructor/getter/setter/data patterns are used broadly).
- Joda-Time (2.14.2), Guava (28.1-jre).
- SM-2 spaced repetition algorithm (custom implementation in `sm2/` package).
- Tests: JUnit 5, Mockito, Spring Test.
- Build tool: Maven wrapper (`mvnw`, `mvnw.cmd`).

## Project Structure
- `src/main/java/com/loopy/config` - Spring config (`SecurityConfig`).
- `src/main/java/com/loopy/controller` - REST controllers (`@RestController`).
- `src/main/java/com/loopy/service` - business logic/services.
- `src/main/java/com/loopy/repository` - Spring Data JPA repositories.
- `src/main/java/com/loopy/model` - JPA entities + enums.
- `src/main/java/com/loopy/security` - JWT filters, token provider, authentication entry point.
- `src/main/java/com/loopy/exception` - domain exceptions.
- `src/main/java/com/loopy/exception_handler` - global exception mapping (`GlobalExceptionFilter`, `JsonErrorResponse`).
- `src/main/java/com/loopy/logging` - logging utilities.
- `src/main/java/com/loopy/service/dto` - request/response payloads (DTOs).
- `src/main/java/com/loopy/sm2` - SM-2 spaced repetition algorithm implementation.
- `src/test/java/com/loopy` - tests.

## Architectural Patterns
- Layered architecture: controller -> service -> repository -> entity.
- Controllers are generally thin and delegate business logic to services.
- Service layer contains validation, permission checks, and side effects.
- DTO mapping is manual in services (no mapper framework found).
- Error mapping uses custom runtime exceptions resolved by `GlobalExceptionHandler`.
- Constructor injection via Lombok `@RequiredArgsConstructor` is the default.

## Naming Conventions
- Suffixes are consistent and should be preserved:
  - `*Controller`, `*Service`, `*Repository`, `*Request`, `*Response`, `*Dto`, `*Exception`.
- Repository methods follow Spring Data derived query naming (`findBy...`, `existsBy...`, `countBy...`).

## Java Code Style
- **DTOs**: All DTOs must use Lombok `@Data` + `@AllArgsConstructor` format. No Java `record` types for DTOs.
  ```java
  @Data
  @AllArgsConstructor
  public class AuthResponse {
      private String accessToken;
      private String tokenType;
      private long expiresIn;
  }
  ```
- **Exceptions**: All custom exceptions must extend `RuntimeException` with only a `String message` constructor calling `super(message)`. No extra fields, no no-arg constructors. All exception messages must come from `HttpResponseMessage` enum.
  ```java
  public class CardNotFoundException extends RuntimeException {
      public CardNotFoundException(String message) {
          super(message);
      }
  }
  ```
  When throwing exceptions, always use `HttpResponseMessage`:
  ```java
  throw new CardNotFoundException(HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage());
  ```
- Lombok is preferred for boilerplate (`@RequiredArgsConstructor`, `@Data`, `@Builder`).
- `@Transactional` is used on mutating service methods; read-only methods use `@Transactional(readOnly = true)`.
- Validation is split:
  - DTO validation via `jakarta.validation` annotations.
  - Domain/business validation in service methods.
- Prefer existing custom exceptions from `com.loopy.exception` for API consistency.

## API & Integration Patterns
- REST base context path is `/api` (if configured).
- Security:
  - Stateless JWT auth for HTTP via `JwtAuthenticationFilter`.
  - JWT token provider handles token creation/validation.
- Open endpoints include auth paths (see `SecurityConfig`).

## Commands (Build/Test/Run)
- Build: `./mvnw clean package` (Windows: `mvnw.cmd clean package`).
- Run tests: `./mvnw test`.
- Run app locally: `./mvnw spring-boot:run`.
- Run a specific test class: `./mvnw -Dtest=AuthServiceTest test`.
- No lint-specific Maven plugin/config (checkstyle/spotless/pmd) was found in `pom.xml`.

## High-Risk Areas (Do Not Break)
- JWT auth flow (filter chain + token provider).
- Security configuration matcher lists.
- Global exception contract (`JsonErrorResponse`, status mapping) used by tests and API consumers.
- SM-2 algorithm implementation in `sm2/` package (spaced repetition core logic).

## Anti-Patterns to Avoid
- Do not move business logic from service layer into controllers.
- Do not use Java `record` types for DTOs; use Lombok `@Data` + `@AllArgsConstructor` instead.
- Do not add extra fields, no-arg constructors, or custom methods to exception classes — keep them minimal.
- Do not hardcode exception messages in throw sites — always use `HttpResponseMessage` enum values instead.
- Do not silently change API paths or security matcher lists.
- Do not return entities directly when existing endpoints already expose DTO shapes.
- Do not hardcode new secrets/credentials in committed properties files.
- Avoid `System.out.println` in runtime paths; prefer structured logger usage.
- Don't create migrations, there are none in the project.

## Testing Notes for Future Changes
- Tests are located under `src/test/java/com/loopy`.
- Use `application.properties` in `src/test/resources` for test-specific configuration.
- H2 in-memory database is used for tests.
