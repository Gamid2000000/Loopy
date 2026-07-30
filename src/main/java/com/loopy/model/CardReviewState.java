package com.loopy.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "card_review_states",
		uniqueConstraints = @UniqueConstraint(name = "uk_card_review_state_user_card",
				columnNames = {"user_id", "card_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class CardReviewState {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "card_id", nullable = false)
	private Card card;

	@Column(name = "easiness_factor", nullable = false)
	private Double easinessFactor;

	@Column(name = "interval_days", nullable = false)
	private Integer intervalDays;

	@Column(name = "consecutive_correct_count", nullable = false)
	private Integer consecutiveCorrectCount;

	@Column(name = "last_reviewed_at")
	private Instant lastReviewedAt;

	@Column(name = "due_at")
	private Instant dueAt;

	@Version
	private Long version;
}
