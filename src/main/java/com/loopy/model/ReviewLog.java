package com.loopy.model;

import java.time.Instant;
import java.util.UUID;

import com.loopy.model.enumeration.ReviewGrade;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "review_logs", uniqueConstraints = {
        @UniqueConstraint(name = "uk_review_log_user_client_review", columnNames = {"user_id", "client_review_id"}),
        @UniqueConstraint(name = "uk_review_log_session_card", columnNames = "session_card_id")
}, indexes = {
        @jakarta.persistence.Index(name = "idx_review_logs_user_reviewed_at", columnList = "user_id,reviewed_at")
})
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ReviewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_card_id", nullable = false)
    private StudySessionCard sessionCard;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReviewGrade grade;

    @Column(name = "sm2_score", nullable = false)
    private int sm2Score;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "client_review_id", nullable = false, updatable = false)
    private UUID clientReviewId;

    @Column(name = "previous_ease_factor", nullable = false)
    private Double previousEaseFactor;

    @Column(name = "new_ease_factor", nullable = false)
    private Double newEaseFactor;

    @Column(name = "previous_interval_days", nullable = false)
    private Integer previousIntervalDays;

    @Column(name = "new_interval_days", nullable = false)
    private Integer newIntervalDays;

    @Column(name = "previous_consecutive_correct_count", nullable = false)
    private Integer previousConsecutiveCorrectCount;

    @Column(name = "new_consecutive_correct_count", nullable = false)
    private Integer newConsecutiveCorrectCount;

    @Column(name = "previous_due_at")
    private Instant previousDueAt;

    @Column(name = "next_review_at", nullable = false)
    private Instant nextReviewAt;

    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private Instant reviewedAt;
}
