package com.loopy.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import com.loopy.model.StudySessionCard;
import com.loopy.model.enumeration.StudySessionCardStatus;

public interface StudySessionCardRepository extends JpaRepository<StudySessionCard, Long> {
	Optional<StudySessionCard> findFirstBySessionIdAndStatusOrderByPositionAsc(Long sessionId,
			StudySessionCardStatus status);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<StudySessionCard> findFirstWithLockBySessionIdAndStatusOrderByPositionAsc(Long sessionId,
			StudySessionCardStatus status);

	long countBySessionIdAndStatus(Long sessionId, StudySessionCardStatus status);
}
