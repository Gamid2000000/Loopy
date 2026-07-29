# Service Class Formatting

## Class-level annotations

**Class-level annotations go on separate lines**, one per line, directly above the class declaration:

```java
// CORRECT
@Service
@RequiredArgsConstructor
public class MyService {

// INCORRECT
@Service @RequiredArgsConstructor
public class MyService {
```

## Transactional annotations

**`@Transactional` / `@Transactional(readOnly = true)` must be on its own line** above the method, never on the same line as the method signature:

```java
// CORRECT
@Transactional
public void doSomething() {

// INCORRECT
@Transactional public void doSomething() {
```

## Method declarations

**Each method must be on its own line** — never put two method declarations on one line.

```java
// INCORRECT
@Transactional(readOnly = true) public Foo getById(...) { return ...; }
@Transactional(readOnly = true) public Bar getActive(...) { return ...; }

// CORRECT
@Transactional(readOnly = true)
public Foo getById(...) {
    return ...;
}

@Transactional(readOnly = true)
public Bar getActive(...) {
    return ...;
}
```

## Braces

**Always use braces** for `if`, `for`, `while` statements, even for single-line bodies.

```java
// CORRECT
if (condition) {
    throw new SomeException();
}

// INCORRECT
if (condition) throw new SomeException();
```

## One statement per line

**One statement per line.** Never chain statements with `;` on the same line.

```java
// INCORRECT
session.setStatus(CANCELLED); session.setCancelledAt(now);

// CORRECT
session.setStatus(CANCELLED);
session.setCancelledAt(now);
```

## Long methods → private helpers

**Break long methods into private helpers** named with descriptive verbs.  
A service method should read as a sequence of clear steps, not a wall of inline logic.

```java
// CORRECT — create() reads like a recipe
@Transactional
public FooResponse create(...) {
    User user = resolveUser(principal);
    Deck deck = resolveDeck(user, deckId);
    ensureDeckActive(deck);
    ensureNoActiveSession(user.getId(), deck.getId());
    // ...
}

private User resolveUser(...) { ... }
private Deck resolveDeck(...) { ... }
private void ensureDeckActive(Deck deck) { ... }
```

Good helper name patterns: `resolve*`, `ensure*`, `validate*`, `calc*`, `load*`, `build*`, `make*`, `find*`, `toResponse`/`toSummary`.

## Builder patterns

**Builder patterns with 3+ fields** should place each `.method()` call on its own indented line:

```java
// CORRECT
return Entity.builder()
        .field1(value1)
        .field2(value2)
        .field3(value3)
        .build();

// INCORRECT
return Entity.builder().field1(value1).field2(value2).field3(value3).build();
```

## Repository calls

**Repository calls spanning >120 chars** should break the chain onto continuation lines:

```java
// CORRECT
StudySession session = sessionRepository
        .findByUserIdAndDeckIdAndStatus(user.getId(), deckId, StudySessionStatus.ACTIVE)
        .orElseThrow(() -> new StudySessionNotFoundException(
                HttpResponseMessage.HTTP_STUDY_SESSION_NOT_FOUND.getMessage()));
```

## Logical block spacing

**Separate logical blocks within a method with a blank line.**  
A method body should not be a continuous wall of statements. Group related lines and separate distinct logical steps:

```java
// CORRECT — logical steps visually separated
@Transactional
public FooResponse create(...) {
    User user = resolveUser(principal);
    Deck deck = resolveDeck(user, deckId);
    ensureDeckActive(deck);

    Profile profile = resolveProfile(user.getId());
    Instant now = clock.instant();

    int remaining = calcRemaining(...);

    List<Item> items = loadItems(...);

    Entity entity = buildEntity(...);
    return toResponse(entity);
}

// INCORRECT — no separation, wall of text
@Transactional
public FooResponse create(...) {
    User user = resolveUser(principal);
    Deck deck = resolveDeck(user, deckId);
    ensureDeckActive(deck);
    Profile profile = resolveProfile(user.getId());
    Instant now = clock.instant();
    int remaining = calcRemaining(...);
    List<Item> items = loadItems(...);
    Entity entity = buildEntity(...);
    return toResponse(entity);
}
```

Typical boundaries for blank lines:
- After auth/resolve block → before data loading
- After validation → before computation
- After computation → before persistence
- After loading → before building response
