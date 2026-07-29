package com.loopy.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.CardNotFoundException;
import com.loopy.exception.CardStateConflictException;
import com.loopy.exception.CardUpdateEmptyException;
import com.loopy.exception.DeckNotFoundException;
import com.loopy.exception.DeckStateConflictException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CardResponse;
import com.loopy.service.dto.CardSummaryResponse;
import com.loopy.service.dto.CreateCardRequest;
import com.loopy.service.dto.UpdateCardRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CardService {
	private final CardRepository cardRepository;
	private final CardReviewStateRepository cardReviewStateRepository;
	private final DeckRepository deckRepository;
	private final UserService userService;
@Transactional
public CardResponse create(UserPrincipal principal, Long deckId, CreateCardRequest request) {
    User owner = currentUser(principal);
    Deck deck = findOwnedDeck(owner, deckId);
    ensureDeckActive(deck);
    Card card = cardRepository
            .save(Card.builder().deck(deck).front(request.getFront().trim())
                    .back(request.getBack().trim())
                    .example(trimToNull(request.getExample()))
                    .note(trimToNull(request.getNote()))
                    .status(CardStatus.ACTIVE).build());
    if (cardReviewStateRepository.existsByUserIdAndCardId(owner.getId(), card.getId())) {
        throw new CardStateConflictException(
                HttpResponseMessage.HTTP_CARD_REVIEW_STATE_ALREADY_EXISTS.getMessage());
    }
    cardReviewStateRepository.save(CardReviewState.builder().user(owner).card(card)
            .easinessFactor(2.5d).intervalDays(0).consecutiveCorrectCount(0)
            .lastReviewedAt(null).dueAt(null).build());
    return toResponse(card);
}
	@Transactional(readOnly = true)
	public Page<CardSummaryResponse> getActiveCards(UserPrincipal principal, Long deckId,
			Pageable pageable) {
		User owner = currentUser(principal);
		findActiveDeck(owner, deckId);
		return cardRepository.findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus(deckId,
				owner.getId(), DeckStatus.ACTIVE, CardStatus.ACTIVE, pageable).map(this::toSummary);
	}

	@Transactional(readOnly = true)
	public CardResponse getById(UserPrincipal principal, Long cardId) {
		User owner = currentUser(principal);
		return toResponse(cardRepository
				.findByIdAndDeckOwnerIdAndDeckStatusAndStatus(cardId, owner.getId(),
						DeckStatus.ACTIVE, CardStatus.ACTIVE)
				.orElseThrow(() -> new CardNotFoundException(
						HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage())));
	}

	@Transactional
	public CardResponse update(UserPrincipal principal, Long cardId, UpdateCardRequest request) {
		if (!request.hasChanges())
			throw new CardUpdateEmptyException(
					HttpResponseMessage.HTTP_CARD_UPDATE_EMPTY.getMessage());
		Card card = findOwnedCard(currentUser(principal), cardId);
		ensureMutable(card);
    if (request.isFrontPresent())
        card.setFront(request.getFront().trim());
    if (request.isBackPresent())
        card.setBack(request.getBack().trim());
    if (request.isExamplePresent())
        card.setExample(trimToNull(request.getExample()));
    if (request.isNotePresent())
        card.setNote(trimToNull(request.getNote()));
		return toResponse(card);
	}

	@Transactional
	public void archive(UserPrincipal principal, Long cardId) {
		Card card = findOwnedCard(currentUser(principal), cardId);
		ensureDeckActive(card.getDeck());
		if (card.getStatus() == CardStatus.ARCHIVED)
			throw new CardStateConflictException(
					HttpResponseMessage.HTTP_CARD_ALREADY_ARCHIVED.getMessage());
    card.setStatus(CardStatus.ARCHIVED);
	}

	@Transactional(readOnly = true)
	public Page<CardSummaryResponse> getArchivedCards(UserPrincipal principal, Long deckId,
			Pageable pageable) {
		User owner = currentUser(principal);
		Deck deck = findOwnedDeck(owner, deckId);
		ensureDeckActive(deck);
		return cardRepository.findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus(deckId,
				owner.getId(), DeckStatus.ACTIVE, CardStatus.ARCHIVED, pageable)
				.map(this::toSummary);
	}

	@Transactional
	public CardResponse restore(UserPrincipal principal, Long cardId) {
		Card card = findOwnedCard(currentUser(principal), cardId);
		ensureDeckActive(card.getDeck());
		if (card.getStatus() == CardStatus.ACTIVE)
			throw new CardStateConflictException(
					HttpResponseMessage.HTTP_CARD_ALREADY_ACTIVE.getMessage());
    card.setStatus(CardStatus.ACTIVE);
		return toResponse(card);
	}

	private User currentUser(UserPrincipal principal) {
		return userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
	}

	private Deck findOwnedDeck(User owner, Long deckId) {
		return deckRepository.findByIdAndOwnerId(deckId, owner.getId())
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
	}

	private Deck findActiveDeck(User owner, Long deckId) {
		return deckRepository.findByIdAndOwnerIdAndStatus(deckId, owner.getId(), DeckStatus.ACTIVE)
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
	}

	private Card findOwnedCard(User owner, Long cardId) {
		return cardRepository.findByIdAndDeckOwnerId(cardId, owner.getId())
				.orElseThrow(() -> new CardNotFoundException(
						HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage()));
	}

	private void ensureDeckActive(Deck deck) {
		if (deck.getStatus() == DeckStatus.ARCHIVED)
			throw new DeckStateConflictException(
					HttpResponseMessage.HTTP_DECK_ARCHIVED.getMessage());
	}

	private void ensureMutable(Card card) {
		ensureDeckActive(card.getDeck());
		if (card.getStatus() == CardStatus.ARCHIVED)
			throw new CardStateConflictException(
					HttpResponseMessage.HTTP_CARD_ARCHIVED.getMessage());
	}

	private String trimToNull(String value) {
		if (value == null)
			return null;
		String normalized = value.trim();
		return normalized.isEmpty() ? null : normalized;
	}

	private CardResponse toResponse(Card card) {
		return new CardResponse(card.getId(), card.getDeck().getId(), card.getFront(),
				card.getBack(), card.getExample(), card.getNote(), card.getStatus(),
				card.getCreatedAt(), card.getUpdatedAt());
	}

	private CardSummaryResponse toSummary(Card card) {
		return new CardSummaryResponse(card.getId(), card.getFront(), card.getBack(),
				card.getStatus(), card.getCreatedAt(), card.getUpdatedAt());
	}
}
