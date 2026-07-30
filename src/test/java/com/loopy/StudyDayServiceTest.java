package com.loopy;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.loopy.model.UserProfile;
import com.loopy.service.DefaultStudyDayService;
import com.loopy.service.UserDayRange;

class StudyDayServiceTest {

    private final DefaultStudyDayService service = new DefaultStudyDayService();

    @Test
    void currentDayUsesTheProfileTimezoneAndHalfOpenBoundaries() {
        UserProfile profile = new UserProfile();
        profile.setTimezone("Europe/Warsaw");

        UserDayRange range = service.currentDay(profile, Instant.parse("2026-07-29T22:30:00Z"));

        assertEquals(LocalDate.of(2026, 7, 30), range.date());
        assertEquals(Instant.parse("2026-07-29T22:00:00Z"), range.start());
        assertEquals(Instant.parse("2026-07-30T22:00:00Z"), range.end());
    }
}
