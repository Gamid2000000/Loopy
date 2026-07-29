package com.loopy.model;

import java.time.Instant;
import com.loopy.model.enumeration.*;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "study_session_cards", uniqueConstraints = {
		@UniqueConstraint(name = "uk_study_session_card", columnNames = {"session_id", "card_id"}),
		@UniqueConstraint(name = "uk_study_session_position",
				columnNames = {"session_id", "position"})},
		indexes = @Index(name = "idx_study_session_cards_session_status_position",
				columnList = "session_id,status,position"))
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class StudySessionCard {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "session_id", nullable = false)
	private StudySession session;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "card_id", nullable = false)
	private Card card;

	@Column(nullable = false)
	private int position;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private StudyCardType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private StudySessionCardStatus status;

	@Column(name = "due_at_snapshot")
	private Instant dueAtSnapshot;

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
