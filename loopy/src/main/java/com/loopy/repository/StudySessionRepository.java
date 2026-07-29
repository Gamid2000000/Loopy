package com.loopy.repository;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.loopy.model.StudySession;
import com.loopy.model.enumeration.StudySessionStatus;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
	Optional<StudySession> findByIdAndUserId(Long id, Long userId);

	Optional<StudySession> findByUserIdAndDeckIdAndStatus(Long userId, Long deckId,
			StudySessionStatus status);

	@Query("""
			select coalesce(sum(s.reviewCardsCount), 0)
			from StudySession s
			where s.user.id = :userId
			and s.status in (com.loopy.model.enumeration.StudySessionStatus.ACTIVE,
				com.loopy.model.enumeration.StudySessionStatus.COMPLETED)
			and s.startedAt >= :from
			and s.startedAt < :to
			""")
	long sumReviewCardsByUserAndStartedAtBetween(Long userId, Instant from, Instant to);

	@Query("""
			select coalesce(sum(s.newCardsCount), 0)
			from StudySession s
			where s.user.id = :userId
			and s.status in (com.loopy.model.enumeration.StudySessionStatus.ACTIVE,
				com.loopy.model.enumeration.StudySessionStatus.COMPLETED)
			and s.startedAt >= :from
			and s.startedAt < :to
			""")
	long sumNewCardsByUserAndStartedAtBetween(Long userId, Instant from, Instant to);
}
