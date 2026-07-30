package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import com.loopy.model.CardReviewState;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.service.Sm2ReviewAdapter;

class Sm2ReviewAdapterTests {

    private static final Instant NOW = Instant.parse("2026-07-29T10:31:00Z");
    private final Sm2ReviewAdapter adapter = new Sm2ReviewAdapter();

    @ParameterizedTest
    @MethodSource("newCardReviews")
    void schedulesNewCardsThroughExistingSm2Library(ReviewGrade grade, int interval,
            int correctCount, double easinessFactor) {
        Sm2ReviewAdapter.ScheduleResult result = adapter.schedule(state(0, 0), grade, NOW);

        assertThat(result.getIntervalDays()).isEqualTo(interval);
        assertThat(result.getConsecutiveCorrectCount()).isEqualTo(correctCount);
        assertThat(result.getEasinessFactor()).isCloseTo(easinessFactor,
                org.assertj.core.data.Offset.offset(0.000001d));
        assertThat(result.getDueAt()).isEqualTo(NOW.plusSeconds(interval * 86_400L));
    }

    @ParameterizedTest
    @MethodSource("reviewCardReviews")
    void schedulesReviewCardsThroughExistingSm2Library(ReviewGrade grade, int interval,
            int correctCount, double easinessFactor) {
        Sm2ReviewAdapter.ScheduleResult result = adapter.schedule(state(6, 2), grade, NOW);

        assertThat(result.getIntervalDays()).isEqualTo(interval);
        assertThat(result.getConsecutiveCorrectCount()).isEqualTo(correctCount);
        assertThat(result.getEasinessFactor()).isCloseTo(easinessFactor,
                org.assertj.core.data.Offset.offset(0.000001d));
        assertThat(result.getDueAt()).isEqualTo(NOW.plusSeconds(interval * 86_400L));
    }

    private static Stream<Arguments> newCardReviews() {
        return Stream.of(
                Arguments.of(ReviewGrade.AGAIN, 0, 0, 2.5d),
                Arguments.of(ReviewGrade.HARD, 1, 1, 2.36d),
                Arguments.of(ReviewGrade.GOOD, 1, 1, 2.5d),
                Arguments.of(ReviewGrade.EASY, 1, 1, 2.6d));
    }

    private static Stream<Arguments> reviewCardReviews() {
        return Stream.of(
                Arguments.of(ReviewGrade.AGAIN, 0, 0, 2.5d),
                Arguments.of(ReviewGrade.HARD, 14, 3, 2.36d),
                Arguments.of(ReviewGrade.GOOD, 15, 3, 2.5d),
                Arguments.of(ReviewGrade.EASY, 16, 3, 2.6d));
    }

    private CardReviewState state(int intervalDays, int correctCount) {
        return CardReviewState.builder()
                .id(1L)
                .easinessFactor(2.5d)
                .intervalDays(intervalDays)
                .consecutiveCorrectCount(correctCount)
                .build();
    }
}
