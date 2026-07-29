package com.loopy.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.CardReviewState;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;

public interface CardReviewStateRepository extends JpaRepository<CardReviewState, Long> {
    Optional<CardReviewState> findByUserIdAndCardId(Long userId, Long cardId);
    boolean existsByUserIdAndCardId(Long userId, Long cardId);
    @Query("""
            select s from CardReviewState s
            where s.user.id = :userId
              and s.card.deck.id = :deckId
              and s.card.deck.status = :deckStatus
              and s.card.status = :cardStatus
              and s.dueAt is not null
              and s.dueAt <= :now
            order by s.dueAt asc, s.id asc
            """)
    List<CardReviewState> findDueForStudy(Long userId, Long deckId, DeckStatus deckStatus,
            CardStatus cardStatus, Instant now, Pageable pageable);
    @Query("""
            select s from CardReviewState s
            where s.user.id = :userId
              and s.card.deck.id = :deckId
              and s.card.deck.status = :deckStatus
              and s.card.status = :cardStatus
              and s.dueAt is null
              and s.lastReviewedAt is null
              and s.consecutiveCorrectCount = 0
            order by s.card.createdAt asc, s.card.id asc
            """)
    List<CardReviewState> findNewForStudy(Long userId, Long deckId, DeckStatus deckStatus,
            CardStatus cardStatus, Pageable pageable);
}
