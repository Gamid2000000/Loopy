package com.loopy.model;

import java.time.Instant;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_profiles",
		uniqueConstraints = @UniqueConstraint(name = "uk_user_profiles_user",
				columnNames = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class UserProfile {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "display_name", nullable = false, length = 100)
	private String displayName;

	@Column(name = "native_language", length = 35)
	private String nativeLanguage;

	@Column(name = "learning_language", length = 35)
	private String learningLanguage;

	@Column(nullable = false, length = 100)
	private String timezone;

	@Column(name = "daily_new_cards_limit", nullable = false)
	private int dailyNewCardsLimit;

	@Column(name = "daily_review_limit", nullable = false)
	private int dailyReviewLimit;

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
