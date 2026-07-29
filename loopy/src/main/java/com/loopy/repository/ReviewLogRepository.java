package com.loopy.repository;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.ReviewLog;

public interface ReviewLogRepository extends JpaRepository<ReviewLog, Long> {

    Optional<ReviewLog> findByUserIdAndClientReviewId(Long userId, UUID clientReviewId);

    @Query("""
            select r.reviewedAt as reviewedAt, r.grade as grade, r.responseTimeMs as responseTimeMs
            from ReviewLog r
            where r.user.id = :userId
            and r.reviewedAt >= :from
            and r.reviewedAt < :to
            """)
    List<ReviewLogStatisticsProjection> findStatisticsByUserAndReviewedAtBetween(Long userId,
            Instant from, Instant to);

    @Query("""
            select r.reviewedAt as reviewedAt, r.grade as grade, r.responseTimeMs as responseTimeMs
            from ReviewLog r
            where r.user.id = :userId
            """)
    List<ReviewLogStatisticsProjection> findAllStatisticsByUser(Long userId);
}
