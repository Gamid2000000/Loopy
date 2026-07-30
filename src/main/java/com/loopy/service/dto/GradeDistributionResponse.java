package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GradeDistributionResponse {
    private long again;
    private long hard;
    private long good;
    private long easy;
}
