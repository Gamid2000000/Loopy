package com.loopy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.Card;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;

public interface CardRepository extends JpaRepository<Card, Long>, JpaSpecificationExecutor<Card> {
    Page<Card> findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus(Long deckId, Long ownerId,
            DeckStatus deckStatus, CardStatus cardStatus, Pageable pageable);
    Optional<Card> findByIdAndDeckOwnerIdAndDeckStatusAndStatus(Long cardId, Long ownerId,
            DeckStatus deckStatus, CardStatus cardStatus);
    Optional<Card> findByIdAndDeckOwnerId(Long cardId, Long ownerId);
    List<Card> findAllByDeckIdAndDeckOwnerIdAndIdInOrderByIdAsc(Long deckId, Long ownerId,
            List<Long> cardIds);

    @Query("""
            select c.id as id, c.front as front, c.back as back, c.status as status
            from Card c
            where c.deck.id = :deckId
            """)
    List<CardDuplicateKeyProjection> findDuplicateKeysByDeckId(Long deckId);
}
