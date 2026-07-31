package com.loopy.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.CardImportService;
import com.loopy.service.CardService;
import com.loopy.service.dto.CardImportPreviewRequest;
import com.loopy.service.dto.CardImportPreviewResponse;
import com.loopy.service.dto.CardImportRequest;
import com.loopy.service.dto.CardImportResultResponse;
import com.loopy.service.dto.CardResponse;
import com.loopy.service.dto.CardSummaryResponse;
import com.loopy.service.dto.BulkCardActionRequest;
import com.loopy.service.dto.BulkCardActionResponse;
import com.loopy.service.dto.CreateCardRequest;
import com.loopy.service.dto.UpdateCardRequest;
import com.loopy.model.enumeration.CardSort;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardController {
	private final CardService cardService;
	private final CardImportService cardImportService;

	@PostMapping("/decks/{deckId}")
	public ResponseEntity<CardResponse> create(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @Valid @RequestBody CreateCardRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(cardService.create(principal, deckId, request));
	}

	@PostMapping("/decks/{deckId}/import/preview")
	public CardImportPreviewResponse importPreview(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId,
			@Valid @RequestBody CardImportPreviewRequest request) {
		return cardImportService.preview(principal, deckId, request);
	}

	@PostMapping("/decks/{deckId}/import")
	public CardImportResultResponse importCards(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId,
			@Valid @RequestBody CardImportRequest request) {
		return cardImportService.importCards(principal, deckId, request);
	}

	@GetMapping("/decks/{deckId}")
	public Page<CardSummaryResponse> active(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size, @RequestParam(required = false) String query,
			@RequestParam(defaultValue = "UPDATED_DESC") CardSort sort) {
		return cardService.getActiveCards(principal, deckId, query, page(page, size, sort));
	}

	@GetMapping("/decks/{deckId}/archived")
	public Page<CardSummaryResponse> archived(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size, @RequestParam(required = false) String query,
			@RequestParam(defaultValue = "UPDATED_DESC") CardSort sort) {
		return cardService.getArchivedCards(principal, deckId, query, page(page, size, sort));
	}

	@PostMapping("/decks/{deckId}/bulk/archive")
	public BulkCardActionResponse bulkArchive(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @Valid @RequestBody BulkCardActionRequest request) {
		return cardService.bulkArchive(principal, deckId, request);
	}

	@PostMapping("/decks/{deckId}/bulk/restore")
	public BulkCardActionResponse bulkRestore(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @Valid @RequestBody BulkCardActionRequest request) {
		return cardService.bulkRestore(principal, deckId, request);
	}

	@GetMapping("/{cardId}")
	public CardResponse get(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long cardId) {
		return cardService.getById(principal, cardId);
	}

	@PatchMapping("/{cardId}")
	public CardResponse update(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long cardId, @RequestBody UpdateCardRequest request) {
		return cardService.update(principal, cardId, request);
	}

	@DeleteMapping("/{cardId}")
	public ResponseEntity<Void> archive(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long cardId) {
		cardService.archive(principal, cardId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{cardId}/restore")
	public CardResponse restore(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long cardId) {
		return cardService.restore(principal, cardId);
	}

	private PageRequest page(int page, int size, CardSort cardSort) {
		if (page < 0 || size < 1 || size > 100)
			throw new IllegalArgumentException(
					"page must be non-negative and size must be between 1 and 100");
		org.springframework.data.domain.Sort sort = switch (cardSort) {
			case UPDATED_DESC -> org.springframework.data.domain.Sort.by(
					org.springframework.data.domain.Sort.Order.desc("updatedAt"), org.springframework.data.domain.Sort.Order.desc("id"));
			case CREATED_DESC -> org.springframework.data.domain.Sort.by(
					org.springframework.data.domain.Sort.Order.desc("createdAt"), org.springframework.data.domain.Sort.Order.desc("id"));
			case CREATED_ASC -> org.springframework.data.domain.Sort.by(
					org.springframework.data.domain.Sort.Order.asc("createdAt"), org.springframework.data.domain.Sort.Order.asc("id"));
			case FRONT_ASC -> org.springframework.data.domain.Sort.by(
					org.springframework.data.domain.Sort.Order.asc("front").ignoreCase(), org.springframework.data.domain.Sort.Order.asc("id"));
			case FRONT_DESC -> org.springframework.data.domain.Sort.by(
					org.springframework.data.domain.Sort.Order.desc("front").ignoreCase(), org.springframework.data.domain.Sort.Order.desc("id"));
		};
		return PageRequest.of(page, size, sort);
	}
}
