package com.loopy.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.StatisticsService;
import com.loopy.service.dto.StatisticsOverviewResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

@RestController
@Validated
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/overview")
    public StatisticsOverviewResponse overview(@AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") @Min(7) @Max(90) int days) {
        return statisticsService.overview(principal, days);
    }
}
