package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.ReviewLogRepository;
import com.loopy.repository.ReviewLogStatisticsProjection;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.DailyLimitService;
import com.loopy.service.DashboardService;
import com.loopy.service.StatisticsService;
import com.loopy.service.StudyDayService;
import com.loopy.service.UserDayRange;
import com.loopy.service.UserService;
import com.loopy.service.dto.DashboardResponse;
import com.loopy.service.dto.StatisticsOverviewResponse;
import com.loopy.service.dto.StreakResponse;

class DashboardStatisticsSuccessSemanticsTests {

    private static final Instant NOW = Instant.parse("2026-07-29T12:00:00Z");
    private static final UserPrincipal PRINCIPAL = new UserPrincipal("user@example.com", "token");

    private ReviewLogRepository reviewLogs;
    private UserService userService;
    private StudyDayService studyDayService;
    private UserDayRange today;
    private DashboardService dashboardService;
    private StatisticsService statisticsService;

    @BeforeEach
    void setUp() {
        CardReviewStateRepository reviewStates = mock(CardReviewStateRepository.class);
        reviewLogs = mock(ReviewLogRepository.class);
        StudySessionRepository sessions = mock(StudySessionRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        userService = mock(UserService.class);
        studyDayService = mock(StudyDayService.class);
        DailyLimitService dailyLimits = mock(DailyLimitService.class);
        StatisticsService dashboardStatistics = mock(StatisticsService.class);
        Clock clock = Clock.fixed(NOW, ZoneId.of("UTC"));

        User user = User.builder().id(1L).name("User").email(PRINCIPAL.getEmail())
                .passwordHash("hash").build();
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setTimezone("UTC");
        profile.setDailyNewCardsLimit(20);
        profile.setDailyReviewLimit(100);
        today = new UserDayRange(LocalDate.of(2026, 7, 29), ZoneId.of("UTC"),
                Instant.parse("2026-07-29T00:00:00Z"), Instant.parse("2026-07-30T00:00:00Z"));

        when(userService.getWithException(PRINCIPAL.getEmail())).thenReturn(user);
        when(profiles.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(studyDayService.currentDay(eq(profile), any(Instant.class))).thenReturn(today);
        when(studyDayService.day(eq(profile), any(LocalDate.class))).thenAnswer(invocation -> {
            LocalDate date = invocation.getArgument(1);
            return new UserDayRange(date, ZoneId.of("UTC"), date.atStartOfDay(ZoneId.of("UTC")).toInstant(),
                    date.plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant());
        });
        when(dailyLimits.calculate(eq(1L), eq(profile), eq(today)))
                .thenReturn(new DailyLimitService.DailyLimits(0, 0, 100, 20));
        when(dashboardStatistics.calculateStreak(1L, today)).thenReturn(new StreakResponse(0, 0));

        dashboardService = new DashboardService(reviewStates, reviewLogs, sessions, profiles, userService,
                studyDayService, dailyLimits, dashboardStatistics, clock);
        statisticsService = new StatisticsService(reviewLogs, sessions, profiles, userService,
                studyDayService, clock);
    }

    @Test
    void hardIncreasesDashboardSuccessfulAnswersCountAndSuccessRate() {
        stubPeriodLogs(List.of(log(ReviewGrade.HARD, NOW)));

        DashboardResponse dashboard = dashboardService.getDashboard(PRINCIPAL);

        assertThat(dashboard.getToday().getSuccessfulAnswersCount()).isEqualTo(1);
        assertThat(dashboard.getToday().getSuccessRate()).isEqualTo(100.0);
    }

    @Test
    void hardIsSuccessfulInStatisticsOverviewAndActivityDay() {
        stubPeriodLogs(List.of(log(ReviewGrade.HARD, NOW)));

        StatisticsOverviewResponse overview = statisticsService.overview(PRINCIPAL, 1);

        assertThat(overview.getSuccessfulAnswers()).isEqualTo(1);
        assertThat(overview.getSuccessRate()).isEqualTo(100.0);
        assertThat(overview.getActivity()).singleElement().satisfies(activity ->
                assertThat(activity.getSuccessfulAnswersCount()).isEqualTo(1));
    }

    @Test
    void dashboardAndStatisticsUseTheSameSuccessSemantics() {
        stubPeriodLogs(List.of(
                log(ReviewGrade.AGAIN, NOW), log(ReviewGrade.AGAIN, NOW),
                log(ReviewGrade.HARD, NOW), log(ReviewGrade.HARD, NOW), log(ReviewGrade.HARD, NOW),
                log(ReviewGrade.GOOD, NOW), log(ReviewGrade.GOOD, NOW), log(ReviewGrade.GOOD, NOW),
                log(ReviewGrade.GOOD, NOW), log(ReviewGrade.EASY, NOW)));

        DashboardResponse dashboard = dashboardService.getDashboard(PRINCIPAL);
        StatisticsOverviewResponse overview = statisticsService.overview(PRINCIPAL, 1);

        assertThat(dashboard.getToday().getSuccessfulAnswersCount()).isEqualTo(8);
        assertThat(dashboard.getToday().getSuccessRate()).isEqualTo(80.0);
        assertThat(overview.getSuccessfulAnswers()).isEqualTo(8);
        assertThat(overview.getSuccessRate()).isEqualTo(80.0);
    }

    @Test
    void againIsNotSuccessfulInDashboardOrStatistics() {
        stubPeriodLogs(List.of(log(ReviewGrade.AGAIN, NOW)));

        DashboardResponse dashboard = dashboardService.getDashboard(PRINCIPAL);
        StatisticsOverviewResponse overview = statisticsService.overview(PRINCIPAL, 1);

        assertThat(dashboard.getToday().getSuccessfulAnswersCount()).isZero();
        assertThat(overview.getSuccessfulAnswers()).isZero();
    }

    @Test
    void emptyAnswersHaveZeroSuccessRateInDashboardAndStatistics() {
        stubPeriodLogs(List.of());

        DashboardResponse dashboard = dashboardService.getDashboard(PRINCIPAL);
        StatisticsOverviewResponse overview = statisticsService.overview(PRINCIPAL, 1);

        assertThat(dashboard.getToday().getSuccessRate()).isZero();
        assertThat(overview.getSuccessRate()).isZero();
    }

    private void stubPeriodLogs(List<ReviewLogStatisticsProjection> logs) {
        when(reviewLogs.findStatisticsByUserAndReviewedAtBetween(eq(1L), any(Instant.class),
                any(Instant.class))).thenReturn(logs);
        when(reviewLogs.findAllStatisticsByUser(anyLong())).thenReturn(List.of());
    }

    private ReviewLogStatisticsProjection log(ReviewGrade grade, Instant reviewedAt) {
        ReviewLogStatisticsProjection log = mock(ReviewLogStatisticsProjection.class);
        when(log.getGrade()).thenReturn(grade);
        when(log.getReviewedAt()).thenReturn(reviewedAt);
        return log;
    }
}
