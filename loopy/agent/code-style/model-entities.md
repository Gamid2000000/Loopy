# Model / Entity Formatting

## Annotations — one per line

**Each annotation goes on its own line**, never stacked on the same line:

```java
// CORRECT
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "user_id", nullable = false)
private User user;

// INCORRECT
@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
private User user;
```

## Blank line between fields

**Every field must be separated from the next by a blank line.**  
Fields without spacing become a wall of text that is hard to scan:

```java
// CORRECT
@Column(name = "easiness_factor", nullable = false)
private Double easinessFactor;

@Column(name = "interval_days", nullable = false)
private Integer intervalDays;

@Column(name = "due_at")
private Instant dueAt;

// INCORRECT — no blank lines between fields
@Column(name = "easiness_factor", nullable = false)
private Double easinessFactor;
@Column(name = "interval_days", nullable = false)
private Integer intervalDays;
@Column(name = "due_at")
private Instant dueAt;
```

This applies to **all fields** — no exceptions. The `@Version` field is just another field and must also have a blank line before it.

## Logical field grouping (optional)

Where possible, group related fields with a blank line between groups and no extra gap within a group:

```java
// user, deck — relationships
@ManyToOne(...)
@JoinColumn(...)
private User user;

@ManyToOne(...)
@JoinColumn(...)
private Deck deck;

// easinessFactor, intervalDays, consecutiveCorrectCount — SM2 state
@Column(name = "easiness_factor", nullable = false)
private Double easinessFactor;

@Column(name = "interval_days", nullable = false)
private Integer intervalDays;

@Column(name = "consecutive_correct_count", nullable = false)
private Integer consecutiveCorrectCount;

// lastReviewedAt, dueAt — scheduling
@Column(name = "last_reviewed_at")
private Instant lastReviewedAt;

@Column(name = "due_at")
private Instant dueAt;
```
