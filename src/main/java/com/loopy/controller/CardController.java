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
import com.loopy.service.CardService;
import com.loopy.service.dto.CardResponse;
import com.loopy.service.dto.CardSummaryResponse;
import com.loopy.service.dto.CreateCardRequest;
import com.loopy.service.dto.UpdateCardRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardController {
	private final CardService cardService;

	@PostMapping("/decks/{deckId}")
	public ResponseEntity<CardResponse> create(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @Valid @RequestBody CreateCardRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(cardService.create(principal, deckId, request));
	}

	@GetMapping("/decks/{deckId}")
	public Page<CardSummaryResponse> active(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return cardService.getActiveCards(principal, deckId, page(page, size));
	}

	@GetMapping("/decks/{deckId}/archived")
	public Page<CardSummaryResponse> archived(@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long deckId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return cardService.getArchivedCards(principal, deckId, page(page, size));
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

	private PageRequest page(int page, int size) {
		if (page < 0 || size < 1 || size > 100)
			throw new IllegalArgumentException(
					"page must be non-negative and size must be between 1 and 100");
		return PageRequest.of(page, size,
				org.springframework.data.domain.Sort.by("createdAt").descending());
	}
}
