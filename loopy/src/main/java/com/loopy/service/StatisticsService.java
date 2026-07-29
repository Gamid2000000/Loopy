package com.loopy.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopy.exception.UserProfileNotFoundException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.ReviewLogRepository;
import com.loopy.repository.ReviewLogStatisticsProjection;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.dto.ActivityDayResponse;
import com.loopy.service.dto.GradeDistributionResponse;
import com.loopy.service.dto.StatisticsOverviewResponse;
import com.loopy.service.dto.StreakResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final ReviewLogRepository reviewLogRepository;
    private final StudySessionRepository sessionRepository;
    private final UserProfileRepository profileRepository;
    private final UserService userService;
    private final StudyDayService studyDayService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public StatisticsOverviewResponse overview(UserPrincipal principal, int days) {
        User user = userService.getWithException(AuthService.normalizeEmail(principal.getEmail()));
        UserProfile profile = findProfile(user.getId());
        Instant now = clock.instant();
        UserDayRange today = studyDayService.currentDay(profile, now);
        LocalDate fromDate = today.date().minusDays(days - 1L);
        UserDayRange from = studyDayService.day(profile, fromDate);

        List<ReviewLogStatisticsProjection> logs = reviewLogRepository
                .findStatisticsByUserAndReviewedAtBetween(user.getId(), from.start(), today.end());
        Map<LocalDate, DailyMetrics> metrics = aggregateByDay(logs, today);
        List<ActivityDayResponse> activity = buildActivity(fromDate, days, metrics);
        DailyMetrics total = metrics.values().stream().reduce(new DailyMetrics(), DailyMetrics::merge);
        long completedSessions = sessionRepository
                .countByUserIdAndStatusAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(user.getId(),
                        StudySessionStatus.COMPLETED, from.start(), today.end());

        return new StatisticsOverviewResponse(profile.getTimezone(), fromDate, today.date(), total.answers,
                total.successful, successRate(total), total.studyTimeMs, averageResponseTime(total),
                completedSessions, total.toGrades(), calculateStreak(user.getId(), today), activity);
    }

    public StreakResponse calculateStreak(Long userId, UserDayRange today) {
        List<ReviewLogStatisticsProjection> logs = reviewLogRepository.findAllStatisticsByUser(userId);
        Map<LocalDate, DailyMetrics> metrics = aggregateByDay(logs, today);
        return calculateStreak(metrics, today.date());
    }

    private StreakResponse calculateStreak(Map<LocalDate, DailyMetrics> metrics, LocalDate today) {
        List<LocalDate> days = metrics.entrySet().stream()
                .filter(entry -> entry.getValue().answers > 0)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
        if (days.isEmpty()) {
            return new StreakResponse(0, 0);
        }

        int longest = 0;
        int running = 0;
        LocalDate previous = null;
        for (LocalDate date : days) {
            running = previous != null && date.equals(previous.plusDays(1)) ? running + 1 : 1;
            longest = Math.max(longest, running);
            previous = date;
        }

        int current = 0;
        LocalDate cursor = today;
        while (metrics.containsKey(cursor) && metrics.get(cursor).answers > 0) {
            current++;
            cursor = cursor.minusDays(1);
        }
        if (current == 0 && metrics.containsKey(today.minusDays(1))
                && metrics.get(today.minusDays(1)).answers > 0) {
            cursor = today.minusDays(1);
            while (metrics.containsKey(cursor) && metrics.get(cursor).answers > 0) {
                current++;
                cursor = cursor.minusDays(1);
            }
        }
        return new StreakResponse(current, longest);
    }

    private UserProfile findProfile(Long userId) {
        return profileRepository.findByUserId(userId).orElseThrow(() -> new UserProfileNotFoundException(
                HttpResponseMessage.HTTP_USER_PROFILE_NOT_FOUND.getMessage()));
    }

    private Map<LocalDate, DailyMetrics> aggregateByDay(List<ReviewLogStatisticsProjection> logs,
            UserDayRange day) {
        Map<LocalDate, DailyMetrics> result = new HashMap<>();
        for (ReviewLogStatisticsProjection log : logs) {
            LocalDate date = log.getReviewedAt().atZone(day.zoneId()).toLocalDate();
            result.computeIfAbsent(date, ignored -> new DailyMetrics()).add(log);
        }
        return result;
    }

    private List<ActivityDayResponse> buildActivity(LocalDate fromDate, int days,
            Map<LocalDate, DailyMetrics> metrics) {
        List<ActivityDayResponse> activity = new ArrayList<>();
        for (int offset = 0; offset < days; offset++) {
            LocalDate date = fromDate.plusDays(offset);
            DailyMetrics value = metrics.getOrDefault(date, new DailyMetrics());
            activity.add(new ActivityDayResponse(date, value.answers, value.successful, value.studyTimeMs));
        }
        return activity;
    }

    private double successRate(DailyMetrics metrics) {
        return metrics.answers == 0 ? 0 : round(metrics.successful * 100.0 / metrics.answers);
    }

    private long averageResponseTime(DailyMetrics metrics) {
        return metrics.responseCount == 0 ? 0 : metrics.studyTimeMs / metrics.responseCount;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public static class DailyMetrics {
        private long answers;
        private long successful;
        private long again;
        private long hard;
        private long good;
        private long easy;
        private long studyTimeMs;
        private long responseCount;

        public void add(ReviewLogStatisticsProjection log) {
            answers++;
            if (log.getGrade().isSuccessful()) {
                successful++;
            }
            if (log.getGrade() == ReviewGrade.AGAIN) {
                again++;
            } else if (log.getGrade() == ReviewGrade.HARD) {
                hard++;
            } else if (log.getGrade() == ReviewGrade.GOOD) {
                good++;
            } else if (log.getGrade() == ReviewGrade.EASY) {
                easy++;
            }
            if (log.getResponseTimeMs() != null) {
                studyTimeMs += log.getResponseTimeMs();
                responseCount++;
            }
        }

        public DailyMetrics merge(DailyMetrics other) {
            answers += other.answers;
            successful += other.successful;
            again += other.again;
            hard += other.hard;
            good += other.good;
            easy += other.easy;
            studyTimeMs += other.studyTimeMs;
            responseCount += other.responseCount;
            return this;
        }

        public GradeDistributionResponse toGrades() {
            return new GradeDistributionResponse(again, hard, good, easy);
        }
    }
}
