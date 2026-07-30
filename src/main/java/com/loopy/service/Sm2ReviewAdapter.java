package com.loopy.service;

import java.time.Instant;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.springframework.stereotype.Component;

import com.loopy.model.CardReviewState;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.sm2.Item;
import com.loopy.sm2.Review;
import com.loopy.sm2.Scheduler;
import com.loopy.sm2.Session;

@Component
public class Sm2ReviewAdapter {

    public ScheduleResult schedule(CardReviewState state, ReviewGrade grade, Instant now) {
        Item item = toItem(state);
        Session session = new Session();
        session.applyReview(new Review(item, grade.getSm2Score()));

        Scheduler scheduler = Scheduler.builder()
                .timeProvider(() -> new DateTime(now.toEpochMilli(), DateTimeZone.UTC))
                .build();
        scheduler.applySession(session);

        return new ScheduleResult(item.getEasinessFactor(), Math.round(item.getInterval()),
                item.getConsecutiveCorrectCount(), toInstant(item.getDueDate()));
    }

    private Item toItem(CardReviewState state) {
        return Item.builder()
                .id(state.getId().toString())
                .easinessFactor(state.getEasinessFactor().floatValue())
                .interval(state.getIntervalDays().floatValue())
                .consecutiveCorrectCount(state.getConsecutiveCorrectCount())
                .lastReviewedDate(toDateTime(state.getLastReviewedAt()))
                .dueDate(toDateTime(state.getDueAt()))
                .build();
    }

    private DateTime toDateTime(Instant instant) {
        if (instant == null) {
            return null;
        }
        return new DateTime(instant.toEpochMilli(), DateTimeZone.UTC);
    }

    private Instant toInstant(DateTime dateTime) {
        if (dateTime == null) {
            throw new IllegalStateException("SM-2 scheduler did not produce a due date");
        }
        return Instant.ofEpochMilli(dateTime.getMillis());
    }

    public static class ScheduleResult {
        private final double easinessFactor;
        private final int intervalDays;
        private final int consecutiveCorrectCount;
        private final Instant dueAt;

        public ScheduleResult(double easinessFactor, int intervalDays, int consecutiveCorrectCount,
                Instant dueAt) {
            this.easinessFactor = easinessFactor;
            this.intervalDays = intervalDays;
            this.consecutiveCorrectCount = consecutiveCorrectCount;
            this.dueAt = dueAt;
        }

        public double getEasinessFactor() {
            return easinessFactor;
        }

        public int getIntervalDays() {
            return intervalDays;
        }

        public int getConsecutiveCorrectCount() {
            return consecutiveCorrectCount;
        }

        public Instant getDueAt() {
            return dueAt;
        }
    }
}
