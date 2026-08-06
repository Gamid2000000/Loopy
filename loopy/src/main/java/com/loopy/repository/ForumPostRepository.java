package com.loopy.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.loopy.model.enumeration.ForumPostStatus;
import com.loopy.model.ForumPost;
import com.loopy.service.dto.ForumPostResponse;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    @Query("""
            select new com.loopy.service.dto.ForumPostResponse(
                p.id, p.author.id, p.author.name, p.content, p.createdAt, p.updatedAt)
            from ForumPost p
            where p.topic.id = :topicId
            and p.status = :status
            order by p.createdAt asc, p.id asc
            """)
    Page<ForumPostResponse> findPublicPosts(Long topicId, ForumPostStatus status, Pageable pageable);
}
