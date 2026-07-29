package com.loopy.service;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.DeckNotFoundException;
import com.loopy.exception.DeckStateConflictException;
import com.loopy.exception.StudySessionConflictException;
import com.loopy.exception.StudySessionNotFoundException;
import com.loopy.exception.UserProfileNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.StudySession;
import com.loopy.model.StudySessionCard;
import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.model.enumeration.StudyCardType;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.StudySessionCardRepository;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CreateStudySessionRequest;
import com.loopy.service.dto.CurrentStudyCardResponse;
import com.loopy.service.dto.StudySessionResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudySessionService {

	private final StudySessionRepository sessionRepository;
	private final StudySessionCardRepository sessionCardRepository;
	private final DeckRepository deckRepository;
	private final CardReviewStateRepository reviewStateRepository;
	private final UserProfileRepository profileRepository;
	private final UserService userService;
	private final Clock clock;

    @Transactional
    public StudySessionResponse create(UserPrincipal principal, CreateStudySessionRequest request) {
        User user = resolveUser(principal);
        Deck deck = resolveDeck(user, request.getDeckId());
        ensureDeckActive(deck);
        ensureNoActiveSession(user.getId(), deck.getId());

        UserProfile profile = resolveProfile(user.getId());
        Instant now = clock.instant();
        ZoneId zone = resolveZone(profile);
        Instant start = now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
        Instant end = now.atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone).toInstant();

        int reviewRemaining = calcReviewRemaining(user.getId(), profile, start, end);
        int newRemaining = calcNewRemaining(user.getId(), profile, start, end);

        List<CardReviewState> review =
                loadDueCards(user.getId(), deck.getId(), now, reviewRemaining);
        List<CardReviewState> fresh = loadNewCards(user.getId(), deck.getId(), newRemaining);
        ensureHasCards(review, fresh);

        StudySession session = buildSession(user, deck, now, review.size(), fresh.size());
        List<StudySessionCard> cards = buildSessionCards(session, review, fresh);
        sessionCardRepository.saveAll(cards);

        return toResponse(session);
    }

	@Transactional(readOnly = true)
	public StudySessionResponse getById(UserPrincipal principal, Long id) {
		return toResponse(findSession(principal, id));
	}

	@Transactional(readOnly = true)
	public StudySessionResponse getActive(UserPrincipal principal, Long deckId) {
		User user = resolveUser(principal);
		StudySession session = sessionRepository
				.findByUserIdAndDeckIdAndStatus(user.getId(), deckId, StudySessionStatus.ACTIVE)
				.orElseThrow(() -> new StudySessionNotFoundException(
						HttpResponseMessage.HTTP_STUDY_SESSION_NOT_FOUND.getMessage()));
		return toResponse(session);
	}

    @Transactional(readOnly = true)
    public CurrentStudyCardResponse getCurrentCard(UserPrincipal principal, Long id) {
        StudySession session = findSession(principal, id);
        if (session.getStatus() != StudySessionStatus.ACTIVE) {
            throw new StudySessionConflictException(
                    HttpResponseMessage.HTTP_STUDY_SESSION_NOT_ACTIVE.getMessage());
        }

        StudySessionCard item = sessionCardRepository
                .findFirstBySessionIdAndStatusOrderByPositionAsc(id, StudySessionCardStatus.PENDING)
                .orElseThrow(() -> new StudySessionConflictException(
                        HttpResponseMessage.HTTP_STUDY_SESSION_NOT_ACTIVE.getMessage()));
        Card card = item.getCard();
        return new CurrentStudyCardResponse(id, item.getId(), card.getId(), item.getPosition(),
                session.getTotalCardsCount(), item.getType(), card.getFront(), card.getBack(),
                card.getExample(), card.getNote());
    }

    @Transactional
    public void cancel(UserPrincipal principal, Long id) {
        StudySession session = findSession(principal, id);

        if (session.getStatus() == StudySessionStatus.CANCELLED) {
            throw new StudySessionConflictException(
                    HttpResponseMessage.HTTP_STUDY_SESSION_ALREADY_CANCELLED.getMessage());
        }
        if (session.getStatus() != StudySessionStatus.ACTIVE) {
            throw new StudySessionConflictException(
                    HttpResponseMessage.HTTP_STUDY_SESSION_NOT_ACTIVE.getMessage());
        }

        session.setStatus(StudySessionStatus.CANCELLED);
        session.setCancelledAt(clock.instant());
    }

	private User resolveUser(UserPrincipal principal) {
		return userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
	}

	private Deck resolveDeck(User user, Long deckId) {
		return deckRepository.findWithLockByIdAndOwnerId(deckId, user.getId())
				.orElseThrow(() -> new DeckNotFoundException(
						HttpResponseMessage.HTTP_DECK_NOT_FOUND.getMessage()));
	}

	private void ensureDeckActive(Deck deck) {
		if (deck.getStatus() != DeckStatus.ACTIVE) {
			throw new DeckStateConflictException(
					HttpResponseMessage.HTTP_DECK_ARCHIVED.getMessage());
		}
	}

	private void ensureNoActiveSession(Long userId, Long deckId) {
		if (sessionRepository
				.findByUserIdAndDeckIdAndStatus(userId, deckId, StudySessionStatus.ACTIVE)
				.isPresent()) {
			throw new StudySessionConflictException(
					HttpResponseMessage.HTTP_STUDY_SESSION_ALREADY_ACTIVE.getMessage());
		}
	}

	private UserProfile resolveProfile(Long userId) {
		return profileRepository.findByUserId(userId)
				.orElseThrow(() -> new UserProfileNotFoundException(
						HttpResponseMessage.HTTP_USER_PROFILE_NOT_FOUND.getMessage()));
	}

	private ZoneId resolveZone(UserProfile profile) {
		try {
			return ZoneId.of(profile.getTimezone());
		} catch (DateTimeException ex) {
			throw new IllegalArgumentException(
					HttpResponseMessage.HTTP_INVALID_USER_TIMEZONE.getMessage());
		}
	}

	private int calcReviewRemaining(Long userId, UserProfile profile, Instant start, Instant end) {
		long doneToday = sessionRepository.sumReviewCardsByUserAndStartedAtBetween(userId, start,
				end);
		return Math.max(0, profile.getDailyReviewLimit() - Math.toIntExact(doneToday));
	}

	private int calcNewRemaining(Long userId, UserProfile profile, Instant start, Instant end) {
		long doneToday = sessionRepository.sumNewCardsByUserAndStartedAtBetween(userId, start,
				end);
		return Math.max(0, profile.getDailyNewCardsLimit() - Math.toIntExact(doneToday));
	}

	private List<CardReviewState> loadDueCards(Long userId, Long deckId, Instant now, int limit) {
		if (limit == 0) {
			return List.of();
		}
		return reviewStateRepository.findDueForStudy(userId, deckId, DeckStatus.ACTIVE,
				CardStatus.ACTIVE, now, PageRequest.of(0, limit));
	}

	private List<CardReviewState> loadNewCards(Long userId, Long deckId, int limit) {
		if (limit == 0) {
			return List.of();
		}
		return reviewStateRepository.findNewForStudy(userId, deckId, DeckStatus.ACTIVE,
				CardStatus.ACTIVE, PageRequest.of(0, limit));
	}

	private void ensureHasCards(List<CardReviewState> review, List<CardReviewState> fresh) {
		if (review.isEmpty() && fresh.isEmpty()) {
			throw new StudySessionConflictException(
					HttpResponseMessage.HTTP_NO_CARDS_AVAILABLE.getMessage());
		}
	}

    private StudySession buildSession(User user, Deck deck, Instant now, int reviewCount,
            int newCount) {
        return sessionRepository.save(StudySession.builder()
                .user(user)
                .deck(deck)
                .status(StudySessionStatus.ACTIVE)
                .startedAt(now)
                .reviewCardsCount(reviewCount)
                .newCardsCount(newCount)
                .totalCardsCount(reviewCount + newCount)
                .build());
    }

	private List<StudySessionCard> buildSessionCards(StudySession session,
			List<CardReviewState> review, List<CardReviewState> fresh) {
		List<StudySessionCard> cards = new ArrayList<>();
		int position = 1;
		for (CardReviewState state : review) {
			cards.add(makeCard(session, state, position++, StudyCardType.REVIEW));
		}
		for (CardReviewState state : fresh) {
			cards.add(makeCard(session, state, position++, StudyCardType.NEW));
		}
		return cards;
	}

    private StudySessionCard makeCard(StudySession session, CardReviewState state, int position,
            StudyCardType type) {
        return StudySessionCard.builder()
                .session(session)
                .card(state.getCard())
                .position(position)
                .type(type)
                .status(StudySessionCardStatus.PENDING)
                .dueAtSnapshot(state.getDueAt())
                .build();
    }

	private StudySession findSession(UserPrincipal principal, Long id) {
		User user = resolveUser(principal);
		return sessionRepository.findByIdAndUserId(id, user.getId())
				.orElseThrow(() -> new StudySessionNotFoundException(
						HttpResponseMessage.HTTP_STUDY_SESSION_NOT_FOUND.getMessage()));
	}

	private StudySessionResponse toResponse(StudySession session) {
		Optional<StudySessionCard> current = Optional.empty();
		long remaining = 0;
		if (session.getStatus() == StudySessionStatus.ACTIVE) {
			current = sessionCardRepository.findFirstBySessionIdAndStatusOrderByPositionAsc(
					session.getId(), StudySessionCardStatus.PENDING);
			remaining = sessionCardRepository.countBySessionIdAndStatus(session.getId(),
					StudySessionCardStatus.PENDING);
		}
		return new StudySessionResponse(session.getId(), session.getDeck().getId(),
				session.getDeck().getName(), session.getStatus(), session.getReviewCardsCount(),
				session.getNewCardsCount(), session.getTotalCardsCount(),
				current.map(StudySessionCard::getPosition).orElse(null), remaining,
				session.getStartedAt(), session.getCompletedAt(), session.getCancelledAt());
	}
}
