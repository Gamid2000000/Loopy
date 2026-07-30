package com.loopy.service.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivityDayResponse {
    private LocalDate date;
    private long answersCount;
    private long successfulAnswersCount;
    private long studyTimeMs;
}
