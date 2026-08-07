package com.loopy.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.enumeration.ForumPostStatus;
import com.loopy.model.ForumPost;
import com.loopy.service.dto.ForumPostResponse;

import jakarta.persistence.LockModeType;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    @Query("""
            select new com.loopy.service.dto.ForumPostResponse(
                p.id, p.author.id, p.author.name, p.content, p.createdAt, p.updatedAt,
                p.version)
            from ForumPost p
            where p.topic.id = :topicId
            and p.status = :status
            order by p.createdAt asc, p.id asc
            """)
    Page<ForumPostResponse> findPublicPosts(Long topicId, ForumPostStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ForumPost p where p.id = :postId")
    Optional<ForumPost> findByIdForUpdate(Long postId);

    @Query("""
            select p.id from ForumPost p
            where p.topic.id = :topicId
            and p.status = :status
            order by p.createdAt asc, p.id asc
            limit 1
            """)
    Optional<Long> findFirstActivePostId(Long topicId, ForumPostStatus status);

    @Query("""
            select count(p), coalesce(max(p.createdAt), null)
            from ForumPost p
            where p.topic.id = :topicId
            and p.status = :status
            """)
    java.util.List<Object[]> aggregateActivePosts(Long topicId, ForumPostStatus status);
}
