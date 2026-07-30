package com.loopy.service;

import org.springframework.stereotype.Service;

import com.loopy.model.UserProfile;
import com.loopy.repository.StudySessionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DailyLimitService {

    private final StudySessionRepository sessionRepository;

    public DailyLimits calculate(Long userId, UserProfile profile, UserDayRange day) {
        long reviewQueued = sessionRepository.sumReviewCardsByUserAndStartedAtBetween(
                userId, day.start(), day.end());
        long newQueued = sessionRepository.sumNewCardsByUserAndStartedAtBetween(
                userId, day.start(), day.end());
        int reviewRemaining = Math.max(0, profile.getDailyReviewLimit() - Math.toIntExact(reviewQueued));
        int newRemaining = Math.max(0, profile.getDailyNewCardsLimit() - Math.toIntExact(newQueued));
        return new DailyLimits(reviewQueued, newQueued, reviewRemaining, newRemaining);
    }

    public record DailyLimits(long reviewQueued, long newQueued, int reviewRemaining,
            int newRemaining) {
    }
}
