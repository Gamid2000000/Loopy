package com.loopy.service;

import java.time.Instant;
import java.time.LocalDate;

import com.loopy.model.UserProfile;

public interface StudyDayService {

    UserDayRange currentDay(UserProfile profile, Instant now);

    UserDayRange day(UserProfile profile, LocalDate date);
}
