package com.loopy.service;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.stereotype.Service;

import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.UserProfile;

@Service
public class DefaultStudyDayService implements StudyDayService {

    @Override
    public UserDayRange currentDay(UserProfile profile, Instant now) {
        ZoneId zoneId = resolveZone(profile);
        return day(profile, now.atZone(zoneId).toLocalDate());
    }

    @Override
    public UserDayRange day(UserProfile profile, LocalDate date) {
        ZoneId zoneId = resolveZone(profile);
        Instant start = date.atStartOfDay(zoneId).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(zoneId).toInstant();
        return new UserDayRange(date, zoneId, start, end);
    }

    private ZoneId resolveZone(UserProfile profile) {
        try {
            return ZoneId.of(profile.getTimezone());
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException(
                    HttpResponseMessage.HTTP_INVALID_USER_TIMEZONE.getMessage());
        }
    }
}
