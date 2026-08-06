package com.loopy.model;

import java.time.Instant;

import com.loopy.model.enumeration.ForumCategoryStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "forum_categories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_forum_categories_slug", columnNames = "slug") }, indexes = {
                @Index(name = "idx_forum_categories_position", columnList = "position") })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @NotBlank
    @Size(min = 2, max = 50)
    @Pattern(regexp = "[a-z0-9-]+")
    private String slug;

    @Column(nullable = false, length = 80)
    @NotBlank
    @Size(min = 2, max = 80)
    private String name;

    @Column(length = 500)
    @Size(max = 500)
    private String description;

    @Column(nullable = false)
    @Min(0)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ForumCategoryStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;
}
