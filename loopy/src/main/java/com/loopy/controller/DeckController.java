package com.loopy.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;

import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.DeckService;
import com.loopy.service.dto.CreateDeckRequest;
import com.loopy.service.dto.DeckResponse;
import com.loopy.service.dto.DeckSummaryResponse;
import com.loopy.service.dto.UpdateDeckRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {
    private final DeckService deckService;

    @PostMapping
    public ResponseEntity<DeckResponse> create(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateDeckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.create(principal, request));
    }

    @GetMapping
    public List<DeckSummaryResponse> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return deckService.getCurrentUserDecks(principal);
    }

    @GetMapping("/archived")
    public List<DeckSummaryResponse> getArchived(@AuthenticationPrincipal UserPrincipal principal) {
        return deckService.getArchived(principal);
    }

    @GetMapping("/{deckId}")
    public DeckResponse getById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long deckId) {
        return deckService.getById(principal, deckId);
    }

    @PatchMapping("/{deckId}")
    public DeckResponse update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long deckId,
            @RequestBody UpdateDeckRequest request) {
        return deckService.update(principal, deckId, request);
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> archive(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long deckId) {
        deckService.archive(principal, deckId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{deckId}/restore")
    public DeckResponse restore(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long deckId) {
        return deckService.restore(principal, deckId);
    }
}
