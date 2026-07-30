package com.loopy.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.CardReviewStateNotFoundException;
import com.loopy.exception.StudySessionConflictException;
import com.loopy.exception.StudySessionNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.CardReviewState;
import com.loopy.model.ReviewLog;
import com.loopy.model.StudySession;
import com.loopy.model.StudySessionCard;
import com.loopy.model.User;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.ReviewLogRepository;
import com.loopy.repository.StudySessionCardRepository;
import com.loopy.repository.StudySessionRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.CurrentStudyCardResponse;
import com.loopy.service.dto.ReviewResultResponse;
import com.loopy.service.dto.SessionProgressResponse;
import com.loopy.service.dto.SubmitReviewRequest;
import com.loopy.service.dto.SubmitReviewResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

	private final StudySessionRepository sessionRepository;
	private final StudySessionCardRepository sessionCardRepository;
	private final CardReviewStateRepository reviewStateRepository;
	private final ReviewLogRepository reviewLogRepository;
	private final UserService userService;
	private final Sm2ReviewAdapter sm2ReviewAdapter;
	private final Clock clock;

	@Transactional
	public SubmitReviewResponse submit(UserPrincipal principal, Long sessionId,
			SubmitReviewRequest request) {
		User user = resolveUser(principal);
		Optional<ReviewLog> existing = reviewLogRepository
				.findByUserIdAndClientReviewId(user.getId(), request.getClientReviewId());
		if (existing.isPresent()) {
			return replay(existing.get(), sessionId, request);
		}

		StudySession session = resolveActiveSession(user.getId(), sessionId);
		StudySessionCard sessionCard = resolveCurrentCard(session);
		ensureRequestedCardIsCurrent(sessionCard, request.getSessionCardId());

		CardReviewState state = reviewStateRepository
				.findWithLockByUserIdAndCardId(user.getId(), sessionCard.getCard().getId())
				.orElseThrow(() -> new CardReviewStateNotFoundException(
						HttpResponseMessage.HTTP_CARD_STATE_NOT_FOUND.getMessage()));
		Instant now = clock.instant();
		Sm2ReviewAdapter.ScheduleResult scheduled =
				sm2ReviewAdapter.schedule(state, request.getGrade(), now);
		ensureValidSchedule(scheduled);

		ReviewLog log = reviewLogRepository
				.save(buildLog(user, sessionCard, state, request, scheduled, now));
		applySchedule(state, scheduled, now);
		completeSessionCard(sessionCard, now);
		session.setCompletedCardsCount(session.getCompletedCardsCount() + 1);

		Optional<StudySessionCard> next = findNextCard(session.getId());
		if (next.isEmpty()) {
			session.setStatus(StudySessionStatus.COMPLETED);
			session.setCompletedAt(now);
		}

		return buildResponse(log, session, next);
	}

	private User resolveUser(UserPrincipal principal) {
		return userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
	}

	private StudySession resolveActiveSession(Long userId, Long sessionId) {
		StudySession session = sessionRepository.findWithLockByIdAndUserId(sessionId, userId)
				.orElseThrow(() -> new StudySessionNotFoundException(
						HttpResponseMessage.HTTP_STUDY_SESSION_NOT_FOUND.getMessage()));
		if (session.getStatus() != StudySessionStatus.ACTIVE) {
			throw new StudySessionConflictException(
					session.getStatus() == StudySessionStatus.CANCELLED
							? HttpResponseMessage.HTTP_STUDY_SESSION_ALREADY_CANCELLED.getMessage()
							: HttpResponseMessage.HTTP_STUDY_SESSION_ALREADY_COMPLETED
									.getMessage());
		}
		return session;
	}

	private StudySessionCard resolveCurrentCard(StudySession session) {
		return sessionCardRepository
				.findFirstWithLockBySessionIdAndStatusOrderByPositionAsc(session.getId(),
						StudySessionCardStatus.PENDING)
				.orElseThrow(() -> new StudySessionConflictException(
						HttpResponseMessage.HTTP_STUDY_SESSION_NOT_ACTIVE.getMessage()));
	}

	private void ensureRequestedCardIsCurrent(StudySessionCard sessionCard, Long requestedId) {
		if (!sessionCard.getId().equals(requestedId)) {
			throw new StudySessionConflictException(
					HttpResponseMessage.HTTP_STUDY_SESSION_CARD_NOT_CURRENT.getMessage());
		}
	}

	private void ensureValidSchedule(Sm2ReviewAdapter.ScheduleResult scheduled) {
		if (!Double.isFinite(scheduled.getEasinessFactor()) || scheduled.getEasinessFactor() < 1.3d
				|| scheduled.getIntervalDays() < 0 || scheduled.getConsecutiveCorrectCount() < 0
				|| scheduled.getDueAt() == null) {
			throw new IllegalStateException("SM-2 scheduler returned an invalid schedule");
		}
	}

	private ReviewLog buildLog(User user, StudySessionCard sessionCard, CardReviewState state,
			SubmitReviewRequest request, Sm2ReviewAdapter.ScheduleResult scheduled, Instant now) {
		return ReviewLog.builder().user(user).sessionCard(sessionCard).card(sessionCard.getCard())
				.grade(request.getGrade()).sm2Score(request.getGrade().getSm2Score())
				.responseTimeMs(request.getResponseTimeMs())
				.clientReviewId(request.getClientReviewId())
				.previousEaseFactor(state.getEasinessFactor())
				.newEaseFactor(scheduled.getEasinessFactor())
				.previousIntervalDays(state.getIntervalDays())
				.newIntervalDays(scheduled.getIntervalDays())
				.previousConsecutiveCorrectCount(state.getConsecutiveCorrectCount())
				.newConsecutiveCorrectCount(scheduled.getConsecutiveCorrectCount())
				.previousDueAt(state.getDueAt()).nextReviewAt(scheduled.getDueAt()).reviewedAt(now)
				.build();
	}

	private void applySchedule(CardReviewState state, Sm2ReviewAdapter.ScheduleResult scheduled,
			Instant now) {
		state.setEasinessFactor(scheduled.getEasinessFactor());
		state.setIntervalDays(scheduled.getIntervalDays());
		state.setConsecutiveCorrectCount(scheduled.getConsecutiveCorrectCount());
		state.setLastReviewedAt(now);
		state.setDueAt(scheduled.getDueAt());
	}

	private void completeSessionCard(StudySessionCard sessionCard, Instant now) {
		sessionCard.setStatus(StudySessionCardStatus.REVIEWED);
		sessionCard.setReviewedAt(now);
	}

	private Optional<StudySessionCard> findNextCard(Long sessionId) {
		return sessionCardRepository.findFirstBySessionIdAndStatusOrderByPositionAsc(sessionId,
				StudySessionCardStatus.PENDING);
	}

	private SubmitReviewResponse replay(ReviewLog log, Long sessionId,
			SubmitReviewRequest request) {
		if (!log.getSessionCard().getSession().getId().equals(sessionId)
				|| !log.getSessionCard().getId().equals(request.getSessionCardId())
				|| log.getGrade() != request.getGrade()
				|| !equalsNullable(log.getResponseTimeMs(), request.getResponseTimeMs())) {
			throw new StudySessionConflictException(
					HttpResponseMessage.HTTP_REVIEW_IDEMPOTENCY_CONFLICT.getMessage());
		}

		StudySession session = log.getSessionCard().getSession();
		return buildResponse(log, session, findNextCard(session.getId()));
	}

	private boolean equalsNullable(Long left, Long right) {
		return left == null ? right == null : left.equals(right);
	}

	private SubmitReviewResponse buildResponse(ReviewLog log, StudySession session,
			Optional<StudySessionCard> next) {
		CurrentStudyCardResponse nextCard = next.map(this::toCurrentCard).orElse(null);
		Integer currentPosition = next.map(StudySessionCard::getPosition).orElse(null);
		long remaining = next.isEmpty() ? 0
				: sessionCardRepository.countBySessionIdAndStatus(session.getId(),
						StudySessionCardStatus.PENDING);

		return new SubmitReviewResponse(toReviewResult(log),
				new SessionProgressResponse(session.getId(), session.getStatus(), currentPosition,
						session.getCompletedCardsCount(), remaining, session.getTotalCardsCount()),
				nextCard);
	}

	private ReviewResultResponse toReviewResult(ReviewLog log) {
		return new ReviewResultResponse(log.getId(), log.getCard().getId(), log.getGrade(),
				log.getSm2Score(), log.getPreviousEaseFactor(), log.getNewEaseFactor(),
				log.getPreviousIntervalDays(), log.getNewIntervalDays(),
				log.getPreviousConsecutiveCorrectCount(), log.getNewConsecutiveCorrectCount(),
				log.getPreviousDueAt(), log.getNextReviewAt(), log.getReviewedAt());
	}

	private CurrentStudyCardResponse toCurrentCard(StudySessionCard sessionCard) {
		return new CurrentStudyCardResponse(sessionCard.getSession().getId(), sessionCard.getId(),
				sessionCard.getCard().getId(), sessionCard.getPosition(),
				sessionCard.getSession().getTotalCardsCount(), sessionCard.getType(),
				sessionCard.getCard().getFront(), sessionCard.getCard().getBack(),
				sessionCard.getCard().getExample(), sessionCard.getCard().getNote());
	}
}
