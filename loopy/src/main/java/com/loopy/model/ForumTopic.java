package com.loopy.model;

import java.time.Instant;

import com.loopy.model.User;
import com.loopy.model.enumeration.ForumTopicStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "forum_topics", indexes = {
        @Index(name = "idx_forum_topics_category_activity", columnList = "category_id,status,last_activity_at"),
        @Index(name = "idx_forum_topics_author", columnList = "author_id") })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ForumCategory category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 160)
    @NotBlank
    @Size(min = 5, max = 160)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ForumTopicStatus status;

    @Column(nullable = false)
    private boolean pinned;

    @Column(nullable = false)
    private boolean locked;

    /** Includes the first post and all active replies. */
    @Column(name = "posts_count", nullable = false)
    @Min(0)
    private long postsCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt;

    @Version
    private Long version;
}
