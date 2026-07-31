package com.loopy.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.CardImportException;
import com.loopy.exception.DeckNotFoundException;
import com.loopy.exception.DeckStateConflictException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.repository.CardDuplicateKeyProjection;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CardImportPreviewRequest;
import com.loopy.service.dto.CardImportPreviewResponse;
import com.loopy.service.dto.CardImportPreviewRowResponse;
import com.loopy.service.dto.CardImportRequest;
import com.loopy.service.dto.CardImportResultResponse;
import com.loopy.service.dto.CardImportRowRequest;
import com.loopy.service.dto.CardImportRowStatus;
import com.loopy.service.dto.ImportedCardResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CardImportService {

	private static final int MAX_FRONT_LENGTH = 500;
	private static final int MAX_BACK_LENGTH = 2000;
	private static final int MAX_EXAMPLE_LENGTH = 3000;
	private static final int MAX_NOTE_LENGTH = 3000;
	private static final int MAX_ROWS = 500;

	private final CardRepository cardRepository;
	private final CardReviewStateRepository cardReviewStateRepository;
	private final DeckRepository deckRepository;
	private final UserService userService;

	@Transactional(readOnly = true)
	public CardImportPreviewResponse preview(UserPrincipal principal, Long deckId,
			CardImportPreviewRequest request) {
		User owner = currentUser(principal);
		Deck deck = findOwnedDeck(owner, deckId);
		ensureDeckActive(deck);

		List<CardImportRowRequest> rows = request.getRows();
		if (rows == null || rows.isEmpty()) {
			throw new CardImportException(
					HttpResponseMessage.HTTP_CARD_IMPORT_EMPTY.getMessage());
		}
		if (rows.size() > MAX_ROWS) {
			throw new CardImportException(
					HttpResponseMessage.HTTP_CARD_IMPORT_TOO_MANY_ROWS.getMessage());
		}

		return buildPreview(deck, rows);
	}

	@Transactional
	public CardImportResultResponse importCards(UserPrincipal principal, Long deckId,
			CardImportRequest request) {
		User owner = currentUser(principal);
		List<CardImportRowRequest> rows = request.getRows();

		if (rows == null || rows.isEmpty()) {
			throw new CardImportException(
					HttpResponseMessage.HTTP_CARD_IMPORT_EMPTY.getMessage());
		}
		if (rows.size() > MAX_ROWS) {
			throw new CardImportException(
					HttpResponseMessage.HTTP_CARD_IMPORT_TOO_MANY_ROWS.getMessage());
		}

		Deck deck = deckRepository.findWithLockByIdAndOwnerId(deckId, owner.getId())
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
		ensureDeckActive(deck);

		Set<String> duplicateKeys = buildDuplicateKeySet(deck);

		List<CardImportRowRequest> validRows = new ArrayList<>();
		Set<String> fileDuplicateKeys = new HashSet<>();
		int skippedDuplicates = 0;

		for (CardImportRowRequest row : rows) {
			String normalizedFront = trimToNull(row.getFront());
			String normalizedBack = trimToNull(row.getBack());

			List<String> errors = validateRowFields(normalizedFront, normalizedBack,
					row.getExample(), row.getNote());
			if (!errors.isEmpty()) {
				continue;
			}

			String key = duplicateKey(normalizedFront, normalizedBack);
			if (duplicateKeys.contains(key)) {
				skippedDuplicates++;
				continue;
			}
			if (!fileDuplicateKeys.add(key)) {
				skippedDuplicates++;
				continue;
			}
			validRows.add(row);
			duplicateKeys.add(key);
		}

		if (validRows.isEmpty()) {
			throw new CardImportException(
					HttpResponseMessage.HTTP_CARD_IMPORT_NO_VALID_ROWS.getMessage());
		}

		List<ImportedCardResponse> importedCards = new ArrayList<>();
		List<Card> cardsToSave = new ArrayList<>();
		List<CardReviewState> statesToSave = new ArrayList<>();

		for (int i = 0; i < validRows.size(); i++) {
			CardImportRowRequest row = validRows.get(i);
			Card card = Card.builder()
					.deck(deck)
					.front(row.getFront().trim())
					.back(row.getBack().trim())
					.example(trimToNull(row.getExample()))
					.note(trimToNull(row.getNote()))
					.status(CardStatus.ACTIVE)
					.build();
			cardsToSave.add(card);
		}

		List<Card> savedCards = cardRepository.saveAll(cardsToSave);

		for (int i = 0; i < savedCards.size(); i++) {
			Card card = savedCards.get(i);
			CardImportRowRequest row = validRows.get(i);

			CardReviewState state = CardReviewState.builder()
					.user(owner)
					.card(card)
					.easinessFactor(2.5d)
					.intervalDays(0)
					.consecutiveCorrectCount(0)
					.lastReviewedAt(null)
					.dueAt(null)
					.build();
			statesToSave.add(state);
		}

		cardReviewStateRepository.saveAll(statesToSave);

		for (int i = 0; i < savedCards.size(); i++) {
			Card card = savedCards.get(i);
			CardImportRowRequest row = validRows.get(i);
			importedCards.add(new ImportedCardResponse(
					row.getRowNumber(), card.getId(), card.getFront(), card.getBack()));
		}

		return new CardImportResultResponse(
				rows.size(), importedCards.size(), skippedDuplicates, importedCards);
	}

	private CardImportPreviewResponse buildPreview(Deck deck,
			List<CardImportRowRequest> rows) {
		Set<String> deckDuplicateKeys = buildDuplicateKeySet(deck);
		Set<String> fileDuplicateKeys = new HashSet<>();

		List<CardImportPreviewRowResponse> rowResponses = new ArrayList<>();
		int valid = 0;
		int invalid = 0;
		int duplicateInFile = 0;
		int duplicateInDeck = 0;

		for (CardImportRowRequest row : rows) {
			String normalizedFront = trimToNull(row.getFront());
			String normalizedBack = trimToNull(row.getBack());

			List<String> errors = validateRowFields(normalizedFront, normalizedBack,
					row.getExample(), row.getNote());

			CardImportRowStatus status;
			if (!errors.isEmpty()) {
				status = CardImportRowStatus.INVALID;
				invalid++;
			} else {
				String key = duplicateKey(normalizedFront, normalizedBack);
				if (deckDuplicateKeys.contains(key)) {
					status = CardImportRowStatus.DUPLICATE_IN_DECK;
					duplicateInDeck++;
				} else if (!fileDuplicateKeys.add(key)) {
					status = CardImportRowStatus.DUPLICATE_IN_FILE;
					duplicateInFile++;
				} else {
					status = CardImportRowStatus.VALID;
					valid++;
				}
			}

			rowResponses.add(new CardImportPreviewRowResponse(
					row.getRowNumber(),
					normalizedFront,
					normalizedBack,
					trimToNull(row.getExample()),
					trimToNull(row.getNote()),
					status,
					status == CardImportRowStatus.INVALID ? errors : Collections.emptyList()));
		}

		return new CardImportPreviewResponse(
				rows.size(), valid, invalid, duplicateInFile, duplicateInDeck, rowResponses);
	}

	private Set<String> buildDuplicateKeySet(Deck deck) {
		List<CardDuplicateKeyProjection> cards = cardRepository
				.findDuplicateKeysByDeckId(deck.getId());
		Set<String> keys = new HashSet<>();
		for (CardDuplicateKeyProjection card : cards) {
			keys.add(duplicateKey(card.getFront(), card.getBack()));
		}
		return keys;
	}

	private String duplicateKey(String front, String back) {
		return (front != null ? front.trim() : "") + "|" + (back != null ? back.trim() : "");
	}

	private List<String> validateRowFields(String front, String back, String example,
			String note) {
		List<String> errors = new ArrayList<>();
		if (front == null || front.isEmpty()) {
			errors.add("Лицевая сторона обязательна");
		} else if (front.length() > MAX_FRONT_LENGTH) {
			errors.add("Лицевая сторона превышает 500 символов");
		}
		if (back == null || back.isEmpty()) {
			errors.add("Обратная сторона обязательна");
		} else if (back.length() > MAX_BACK_LENGTH) {
			errors.add("Обратная сторона превышает 2000 символов");
		}
		if (example != null && example.length() > MAX_EXAMPLE_LENGTH) {
			errors.add("Пример превышает 3000 символов");
		}
		if (note != null && note.length() > MAX_NOTE_LENGTH) {
			errors.add("Заметка превышает 3000 символов");
		}
		return errors;
	}

	private User currentUser(UserPrincipal principal) {
		return userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
	}

	private Deck findOwnedDeck(User owner, Long deckId) {
		return deckRepository.findByIdAndOwnerId(deckId, owner.getId())
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
	}

	private void ensureDeckActive(Deck deck) {
		if (deck.getStatus() == DeckStatus.ARCHIVED) {
			throw new DeckStateConflictException(
					HttpResponseMessage.HTTP_DECK_ARCHIVED.getMessage());
		}
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String normalized = value.trim();
		return normalized.isEmpty() ? null : normalized;
	}
}
