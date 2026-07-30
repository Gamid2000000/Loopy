package com.loopy.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public record UserDayRange(LocalDate date, ZoneId zoneId, Instant start, Instant end) {
}
