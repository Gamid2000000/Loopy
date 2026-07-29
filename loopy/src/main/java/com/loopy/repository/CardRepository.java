package com.loopy.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.loopy.model.Card;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;

public interface CardRepository extends JpaRepository<Card, Long> {
    Page<Card> findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus(Long deckId, Long ownerId,
            DeckStatus deckStatus, CardStatus cardStatus, Pageable pageable);
    Optional<Card> findByIdAndDeckOwnerIdAndDeckStatusAndStatus(Long cardId, Long ownerId,
            DeckStatus deckStatus, CardStatus cardStatus);
    Optional<Card> findByIdAndDeckOwnerId(Long cardId, Long ownerId);
}
