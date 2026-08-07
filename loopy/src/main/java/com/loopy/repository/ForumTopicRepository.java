package com.loopy.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.enumeration.ForumCategoryStatus;
import com.loopy.model.enumeration.ForumTopicStatus;
import com.loopy.model.ForumTopic;
import com.loopy.service.dto.ForumCategoryResponse;
import com.loopy.service.dto.ForumTopicResponse;
import com.loopy.service.dto.ForumTopicSummaryResponse;

import jakarta.persistence.LockModeType;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {

    @Query("""
            select new com.loopy.service.dto.ForumCategoryResponse(
                c.id, c.slug, c.name, c.description, count(t), max(t.lastActivityAt))
            from ForumCategory c
            left join ForumTopic t on t.category = c and t.status = :topicStatus
            where c.status = :categoryStatus
            group by c.id, c.slug, c.name, c.description, c.position
            order by c.position asc, c.id asc
            """)
    java.util.List<ForumCategoryResponse> findPublicCategories(ForumCategoryStatus categoryStatus,
            ForumTopicStatus topicStatus);

    @Query("""
            select new com.loopy.service.dto.ForumTopicSummaryResponse(
                t.id, c.slug, t.title, t.author.id, t.author.name, t.pinned, t.locked,
                t.postsCount, t.createdAt, t.lastActivityAt)
            from ForumTopic t
            join t.category c
            where c.slug = :slug
            and c.status = :categoryStatus
            and t.status = :topicStatus
            order by t.pinned desc, t.lastActivityAt desc, t.id desc
            """)
    Page<ForumTopicSummaryResponse> findPublicTopicSummaries(String slug,
            ForumCategoryStatus categoryStatus, ForumTopicStatus topicStatus, Pageable pageable);

    @Query("""
            select new com.loopy.service.dto.ForumTopicResponse(
                t.id, c.id, c.slug, c.name, t.title, t.author.id, t.author.name, t.pinned,
                t.locked, t.postsCount, t.createdAt, t.updatedAt, t.lastActivityAt,
                t.version, null)
            from ForumTopic t
            join t.category c
            where t.id = :topicId
            and t.status = :topicStatus
            and c.status = :categoryStatus
            """)
    Optional<ForumTopicResponse> findPublicTopic(Long topicId, ForumTopicStatus topicStatus,
            ForumCategoryStatus categoryStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from ForumTopic t where t.id = :topicId")
    Optional<ForumTopic> findByIdForUpdate(Long topicId);
}
