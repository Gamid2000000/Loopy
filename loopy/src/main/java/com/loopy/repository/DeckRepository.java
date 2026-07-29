package com.loopy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import com.loopy.model.Deck;
import com.loopy.model.enumeration.DeckStatus;

public interface DeckRepository extends JpaRepository<Deck, Long> {
    List<Deck> findAllByOwnerIdAndStatusOrderByUpdatedAtDesc(Long ownerId, DeckStatus status);
    Optional<Deck> findByIdAndOwnerIdAndStatus(Long deckId, Long ownerId, DeckStatus status);
    Optional<Deck> findByIdAndOwnerId(Long deckId, Long ownerId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Deck> findWithLockByIdAndOwnerId(Long deckId, Long ownerId);
}
