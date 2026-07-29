package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TodayStudyResponse {
    private long answeredCardsCount;
    private long completedSessionsCount;
    private long againCount;
    private long hardCount;
    private long goodCount;
    private long easyCount;
    private long successfulAnswersCount;
    private double successRate;
    private long studyTimeMs;
}
