package com.loopy.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;

@Entity
@Getter
@Builder
public class CardReviewState {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "card_id", nullable = false)
	private Card card;

	@Column(name = "easiness_factor")
	private Short easinessFactor;

	@Column(name = "interval")
	private Short interval;

	@Column(name = "consecutive_correct_count")
	private Short counsecutiveCorrectCount;

	@Column(name = "last_reviewed_at")
	private LocalDateTime lastReviewedAt;

	@Column(name = "due_at")
	private Short dueAt;


	@PrePersist
	protected void prePersist() {
		this.lastReviewedAt = LocalDateTime.now();
	}

	@PreUpdate
	protected void preUpdate() {
		this.lastReviewedAt = LocalDateTime.now();
	}
}

