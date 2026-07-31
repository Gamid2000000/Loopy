package com.loopy.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
import com.loopy.model.enumeration.CardSort;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CardResponse;
import com.loopy.service.dto.CardSummaryResponse;
import com.loopy.service.dto.BulkCardActionRequest;
import com.loopy.service.dto.BulkCardActionResponse;
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
			String query, Pageable pageable) {
		User owner = currentUser(principal);
		findActiveDeck(owner, deckId);
		return findCards(owner, deckId, CardStatus.ACTIVE, query, pageable);
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
			String query, Pageable pageable) {
		User owner = currentUser(principal);
		Deck deck = findOwnedDeck(owner, deckId);
		ensureDeckActive(deck);
		return findCards(owner, deckId, CardStatus.ARCHIVED, query, pageable);
	}

	@Transactional
	public BulkCardActionResponse bulkArchive(UserPrincipal principal, Long deckId,
			BulkCardActionRequest request) {
		return bulkChangeStatus(principal, deckId, request, CardStatus.ARCHIVED);
	}

	@Transactional
	public BulkCardActionResponse bulkRestore(UserPrincipal principal, Long deckId,
			BulkCardActionRequest request) {
		return bulkChangeStatus(principal, deckId, request, CardStatus.ACTIVE);
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

	private Page<CardSummaryResponse> findCards(User owner, Long deckId, CardStatus status,
			String query, Pageable pageable) {
		String normalizedQuery = normalizeQuery(query);
		Specification<Card> specification = (root, ignored, builder) -> builder.and(
				builder.equal(root.get("deck").get("id"), deckId),
				builder.equal(root.get("deck").get("owner").get("id"), owner.getId()),
				builder.equal(root.get("deck").get("status"), DeckStatus.ACTIVE),
				builder.equal(root.get("status"), status));

		if (normalizedQuery != null) {
			String pattern = "%" + escapeLike(normalizedQuery.toLowerCase()) + "%";
			specification = specification.and((root, ignored, builder) -> builder.or(
					builder.like(builder.lower(root.get("front")), pattern, '\\'),
					builder.like(builder.lower(root.get("back")), pattern, '\\'),
					builder.like(builder.lower(root.get("example")), pattern, '\\'),
					builder.like(builder.lower(root.get("note")), pattern, '\\')));
		}

		return cardRepository.findAll(specification, pageable).map(this::toSummary);
	}

	private BulkCardActionResponse bulkChangeStatus(UserPrincipal principal, Long deckId,
			BulkCardActionRequest request, CardStatus targetStatus) {
		User owner = currentUser(principal);
		Deck deck = deckRepository.findWithLockByIdAndOwnerId(deckId, owner.getId())
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
		ensureDeckActive(deck);
		List<Long> cardIds = normalizeCardIds(request.getCardIds());
		List<Card> cards = cardRepository.findAllForBulkActionWithLock(deckId, owner.getId(), cardIds);
		if (cards.size() != cardIds.size())
			throw new CardNotFoundException(HttpResponseMessage.HTTP_CARD_NOT_FOUND.getMessage());

		List<Long> changed = new ArrayList<>();
		List<Long> unchanged = new ArrayList<>();
		for (Card card : cards) {
			if (card.getStatus() == targetStatus) {
				unchanged.add(card.getId());
			} else {
				card.setStatus(targetStatus);
				changed.add(card.getId());
			}
		}
		return new BulkCardActionResponse(cardIds.size(), changed.size(), unchanged.size(), changed,
				unchanged);
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

	private String normalizeQuery(String query) {
		if (query == null)
			return null;
		String normalized = query.trim();
		if (normalized.length() > 200)
			throw new IllegalArgumentException("query must not exceed 200 characters");
		return normalized.isEmpty() ? null : normalized;
	}

	private String escapeLike(String value) {
		return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

	private List<Long> normalizeCardIds(List<Long> requestedIds) {
		if (requestedIds == null || requestedIds.isEmpty())
			throw new IllegalArgumentException("cardIds must contain between 1 and 100 IDs");
		if (requestedIds.size() > 100)
			throw new IllegalArgumentException("cardIds must contain between 1 and 100 IDs");
		LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();
		for (Long cardId : requestedIds) {
			if (cardId == null || cardId <= 0)
				throw new IllegalArgumentException("cardIds must contain positive IDs");
			uniqueIds.add(cardId);
		}
		if (uniqueIds.isEmpty() || uniqueIds.size() > 100)
			throw new IllegalArgumentException("cardIds must contain between 1 and 100 IDs");
		return List.copyOf(uniqueIds);
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
