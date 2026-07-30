package com.loopy.service.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardResponse {
    private Instant generatedAt;
    private String timezone;
    private LocalDate localDate;
    private StudyAvailabilityResponse availability;
    private TodayStudyResponse today;
    private CardStateDistributionResponse cardStates;
    private List<ActiveStudySessionResponse> activeSessions;
    private List<RecentStudySessionResponse> recentSessions;
    private StreakResponse streak;
}
