package com.loopy.service.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StatisticsOverviewResponse {
    private String timezone;
    private LocalDate fromDate;
    private LocalDate toDate;
    private long totalAnswers;
    private long successfulAnswers;
    private double successRate;
    private long totalStudyTimeMs;
    private long averageResponseTimeMs;
    private long completedSessions;
    private GradeDistributionResponse gradeDistribution;
    private StreakResponse streak;
    private List<ActivityDayResponse> activity;
}
