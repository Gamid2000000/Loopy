package com.loopy.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.DeckNotFoundException;
import com.loopy.exception.DeckStateConflictException;
import com.loopy.exception.DeckUpdateEmptyException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Deck;
import com.loopy.model.User;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.repository.DeckRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CreateDeckRequest;
import com.loopy.service.dto.DeckResponse;
import com.loopy.service.dto.DeckSummaryResponse;
import com.loopy.service.dto.UpdateDeckRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeckService {
    private final DeckRepository deckRepository;
    private final UserService userService;

    @Transactional
    public DeckResponse create(UserPrincipal principal, CreateDeckRequest request) {
        User owner = currentUser(principal);
        Deck deck = Deck.builder().owner(owner).name(requiredName(request.getName()))
                .description(normalizeDescription(request.getDescription()))
                .isPublic(Boolean.TRUE.equals(request.getIsPublic()))
                .status(DeckStatus.ACTIVE).build();
        return toResponse(deckRepository.save(deck));
    }

    @Transactional(readOnly = true)
    public List<DeckSummaryResponse> getCurrentUserDecks(UserPrincipal principal) {
        return deckRepository.findAllByOwnerIdAndStatusOrderByUpdatedAtDesc(currentUser(principal).getId(), DeckStatus.ACTIVE)
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public DeckResponse getById(UserPrincipal principal, Long deckId) {
        return toResponse(findActive(currentUser(principal), deckId));
    }

    @Transactional
    public DeckResponse update(UserPrincipal principal, Long deckId, UpdateDeckRequest request) {
        if (!request.hasChanges()) throw new DeckUpdateEmptyException(HttpResponseMessage.HTTP_DECK_UPDATE_EMPTY.getMessage());
        Deck deck = findOwned(currentUser(principal), deckId);
        if (deck.getStatus() == DeckStatus.ARCHIVED) {
            throw new DeckStateConflictException(HttpResponseMessage.HTTP_DECK_ARCHIVED_CANNOT_UPDATE.getMessage());
        }
        if (request.isNamePresent()) deck.setName(requiredName(request.getName()));
        if (request.isDescriptionPresent()) deck.setDescription(normalizeDescription(request.getDescription()));
        if (request.isPublicPresent()) {
            if (request.getIsPublic() == null) throw new IllegalArgumentException("isPublic must be true or false");
            deck.setPublic(request.getIsPublic());
        }
        return toResponse(deck);
    }

    @Transactional
    public void archive(UserPrincipal principal, Long deckId) {
        Deck deck = findOwned(currentUser(principal), deckId);
        if (deck.getStatus() == DeckStatus.ARCHIVED) {
            throw new DeckStateConflictException(HttpResponseMessage.HTTP_DECK_ALREADY_ARCHIVED.getMessage());
        }
        deck.setStatus(DeckStatus.ARCHIVED);
    }

    @Transactional(readOnly = true)
    public List<DeckSummaryResponse> getArchived(UserPrincipal principal) {
        return deckRepository.findAllByOwnerIdAndStatusOrderByUpdatedAtDesc(currentUser(principal).getId(), DeckStatus.ARCHIVED)
                .stream().map(this::toSummary).toList();
    }

    @Transactional
    public DeckResponse restore(UserPrincipal principal, Long deckId) {
        Deck deck = findOwned(currentUser(principal), deckId);
        if (deck.getStatus() == DeckStatus.ACTIVE) {
            throw new DeckStateConflictException(HttpResponseMessage.HTTP_DECK_ALREADY_ACTIVE.getMessage());
        }
        deck.setStatus(DeckStatus.ACTIVE);
        return toResponse(deck);
    }

    private User currentUser(UserPrincipal principal) {
        return userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
    }

    private Deck findActive(User owner, Long deckId) {
        return deckRepository.findByIdAndOwnerIdAndStatus(deckId, owner.getId(), DeckStatus.ACTIVE)
                .orElseThrow(() -> new DeckNotFoundException(HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
    }

    private Deck findOwned(User owner, Long deckId) {
        return deckRepository.findByIdAndOwnerId(deckId, owner.getId()).orElseThrow(() -> new DeckNotFoundException(HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
    }

    private String requiredName(String name) {
        if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Deck name is required");
        String normalized = name.trim();
        if (normalized.length() > 100) throw new IllegalArgumentException("Deck name must not exceed 100 characters");
        return normalized;
    }

    private String normalizeDescription(String description) {
        if (description == null) return null;
        String normalized = description.trim();
        if (normalized.length() > 1000) throw new IllegalArgumentException("Deck description must not exceed 1000 characters");
        return normalized.isEmpty() ? null : normalized;
    }

    private DeckResponse toResponse(Deck deck) {
        return new DeckResponse(deck.getId(), deck.getName(), deck.getDescription(), deck.isPublic(), deck.getStatus(),
                deck.getCreatedAt(), deck.getUpdatedAt());
    }

    private DeckSummaryResponse toSummary(Deck deck) {
        return new DeckSummaryResponse(deck.getId(), deck.getName(), deck.getDescription(), deck.isPublic(), deck.getStatus(),
                deck.getCreatedAt(), deck.getUpdatedAt());
    }
}
