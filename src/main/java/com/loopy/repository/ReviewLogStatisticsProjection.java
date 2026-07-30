package com.loopy.repository;

import java.time.Instant;

import com.loopy.model.enumeration.ReviewGrade;

public interface ReviewLogStatisticsProjection {

    Instant getReviewedAt();

    ReviewGrade getGrade();

    Long getResponseTimeMs();
}
