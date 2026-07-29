package com.loopy.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.UserProfileNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.ReviewLogRepository;
import com.loopy.repository.ReviewLogStatisticsProjection;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.DailyLimitService.DailyLimits;
import com.loopy.service.dto.ActiveStudySessionResponse;
import com.loopy.service.dto.CardStateDistributionResponse;
import com.loopy.service.dto.DashboardResponse;
import com.loopy.service.dto.RecentStudySessionResponse;
import com.loopy.service.dto.StudyAvailabilityResponse;
import com.loopy.service.dto.TodayStudyResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CardReviewStateRepository reviewStateRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final StudySessionRepository sessionRepository;
    private final UserProfileRepository profileRepository;
    private final UserService userService;
    private final StudyDayService studyDayService;
    private final DailyLimitService dailyLimitService;
    private final StatisticsService statisticsService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UserPrincipal principal) {
        User user = userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
        UserProfile profile = findProfile(user.getId());
        Instant now = clock.instant();
        UserDayRange day = studyDayService.currentDay(profile, now);
        DailyLimits limits = dailyLimitService.calculate(user.getId(), profile, day);

        long due = reviewStateRepository.countDueForDashboard(user.getId(), DeckStatus.ACTIVE,
                CardStatus.ACTIVE, now);
        long fresh = reviewStateRepository.countNewForDashboard(user.getId(), DeckStatus.ACTIVE,
                CardStatus.ACTIVE);
        long scheduled = reviewStateRepository.countScheduledForDashboard(user.getId(),
                DeckStatus.ACTIVE, CardStatus.ACTIVE, now);
        List<ReviewLogStatisticsProjection> logs = reviewLogRepository
                .findStatisticsByUserAndReviewedAtBetween(user.getId(), day.start(), day.end());

        return new DashboardResponse(now, profile.getTimezone(), day.date(),
                availability(due, fresh, profile, limits), today(logs, user.getId(), day),
                new CardStateDistributionResponse(due + fresh + scheduled, fresh, due, scheduled),
                activeSessions(user.getId()), recentSessions(user.getId()),
                statisticsService.calculateStreak(user.getId(), day));
    }

    private UserProfile findProfile(Long userId) {
        return profileRepository.findByUserId(userId).orElseThrow(() -> new UserProfileNotFoundException(
                HttpResponseMessage.HTTP_USER_PROFILE_NOT_FOUND.getMessage()));
    }

    private StudyAvailabilityResponse availability(long due, long fresh, UserProfile profile,
            DailyLimits limits) {
        return new StudyAvailabilityResponse(due, fresh, limits.reviewQueued(), limits.newQueued(),
                profile.getDailyReviewLimit(), profile.getDailyNewCardsLimit(), limits.reviewRemaining(),
                limits.newRemaining(), Math.min(due, limits.reviewRemaining()),
                Math.min(fresh, limits.newRemaining()));
    }

    private TodayStudyResponse today(List<ReviewLogStatisticsProjection> logs, Long userId,
            UserDayRange day) {
        long again = logs.stream().filter(log -> log.getGrade() == ReviewGrade.AGAIN).count();
        long hard = logs.stream().filter(log -> log.getGrade() == ReviewGrade.HARD).count();
        long good = logs.stream().filter(log -> log.getGrade() == ReviewGrade.GOOD).count();
        long easy = logs.stream().filter(log -> log.getGrade() == ReviewGrade.EASY).count();
        long successful = logs.stream().filter(log -> log.getGrade().isSuccessful()).count();
        long studyTime = logs.stream().map(ReviewLogStatisticsProjection::getResponseTimeMs)
                .filter(java.util.Objects::nonNull).mapToLong(Long::longValue).sum();
        long completed = sessionRepository
                .countByUserIdAndStatusAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(userId,
                        StudySessionStatus.COMPLETED, day.start(), day.end());
        double rate = logs.isEmpty() ? 0 : Math.round(successful * 10000.0 / logs.size()) / 100.0;
        return new TodayStudyResponse(logs.size(), completed, again, hard, good, easy, successful,
                rate, studyTime);
    }

    private List<ActiveStudySessionResponse> activeSessions(Long userId) {
        return sessionRepository.findActiveSummaries(userId, StudySessionStatus.ACTIVE,
                StudySessionCardStatus.PENDING);
    }

    private List<RecentStudySessionResponse> recentSessions(Long userId) {
        return sessionRepository.findRecentCompletedSummaries(userId, StudySessionStatus.COMPLETED,
                PageRequest.of(0, 5));
    }
}
