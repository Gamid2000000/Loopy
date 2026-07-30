package com.loopy.model;

import java.time.Instant;
import com.loopy.model.enumeration.StudySessionStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "study_sessions",
		indexes = @Index(name = "idx_study_sessions_user_deck_status",
				columnList = "user_id,deck_id,status"))
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class StudySession {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false)
	private Deck deck;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private StudySessionStatus status;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Column(name = "cancelled_at")
	private Instant cancelledAt;

	@Column(name = "review_cards_count", nullable = false)
	private int reviewCardsCount;

	@Column(name = "new_cards_count", nullable = false)
	private int newCardsCount;

	@Column(name = "total_cards_count", nullable = false)
	private int totalCardsCount;

	@Column(name = "completed_cards_count", nullable = false)
	private int completedCardsCount;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Version
	private Long version;

	@PrePersist
	void onCreate() {
		createdAt = updatedAt = Instant.now();
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}
}
