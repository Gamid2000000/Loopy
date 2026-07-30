# JPQL / SQL Style

## Text Blocks

**Use Java text blocks (`"""`) for all multi-line JPQL queries.** Never use string concatenation (`+`).

```java
// CORRECT
@Query("""
        select s from StudySession s
        where s.user.id = :userId
        and s.status = :status
        """)

// INCORRECT
@Query("select s from StudySession s "
    + "where s.user.id = :userId "
    + "and s.status = :status")
```

## Single-line queries

A query may stay on a single line only if it fits within ~120 characters and has no logical sub-clauses.  
**As soon as a `where` with multiple `and` conditions appears — every `and` goes on a new line:**

```java
// INCORRECT — multiple conditions on one line
@Query("select coalesce(sum(s.reviewCardsCount), 0) from StudySession s "
    + "where s.user.id = :userId and s.status = :status "
    + "and s.startedAt >= :from and s.startedAt < :to")

// CORRECT — each logical operation on its own line
@Query("""
        select coalesce(sum(s.reviewCardsCount), 0)
        from StudySession s
        where s.user.id = :userId
        and s.status = :status
        and s.startedAt >= :from
        and s.startedAt < :to
        """)
```

## Enum Parameters

**Pass enum values as parameters**, not as fully qualified class names inline in the query string.

```java
// CORRECT
@Query("select s from CardReviewState s where s.card.status = :cardStatus")
List<CardReviewState> findCards(Long userId, CardStatus cardStatus);

// INCORRECT
@Query("select s from CardReviewState s where s.card.status = com.loopy.model.enumeration.CardStatus.ACTIVE")
List<CardReviewState> findCards(Long userId);
```

## Import — always use short form

**Use the imported `@Query`, never the fully qualified `@org.springframework.data.jpa.repository.Query`.**

```java
// CORRECT
import org.springframework.data.jpa.repository.Query;
// ...
@Query("...")

// INCORRECT
@org.springframework.data.jpa.repository.Query("...")
```
