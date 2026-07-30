package com.loopy.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import com.loopy.model.StudySession;
import com.loopy.model.enumeration.StudySessionStatus;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
	Optional<StudySession> findByIdAndUserId(Long id, Long userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<StudySession> findWithLockByIdAndUserId(Long id, Long userId);

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

	long countByUserIdAndStatusAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(Long userId,
			StudySessionStatus status, Instant from, Instant to);

	@Query("""
			select new com.loopy.service.dto.ActiveStudySessionResponse(
			s.id, d.id, d.name, s.completedCardsCount, s.totalCardsCount, s.startedAt,
			coalesce(min(sc.position), s.totalCardsCount + 1))
			from StudySession s
			join s.deck d
			left join StudySessionCard sc on sc.session = s and sc.status = :pendingStatus
			where s.user.id = :userId
			and s.status = :activeStatus
			group by s.id, d.id, d.name, s.completedCardsCount, s.totalCardsCount, s.startedAt
			order by s.startedAt asc
			""")
	List<com.loopy.service.dto.ActiveStudySessionResponse> findActiveSummaries(Long userId,
			StudySessionStatus activeStatus,
			com.loopy.model.enumeration.StudySessionCardStatus pendingStatus);

	@Query("""
			select new com.loopy.service.dto.RecentStudySessionResponse(
			s.id, d.id, d.name, s.status, s.completedCardsCount, s.totalCardsCount, s.startedAt,
			s.completedAt)
			from StudySession s
			join s.deck d
			where s.user.id = :userId
			and s.status = :completedStatus
			order by s.completedAt desc
			""")
	List<com.loopy.service.dto.RecentStudySessionResponse> findRecentCompletedSummaries(Long userId,
			StudySessionStatus completedStatus, Pageable pageable);
}
