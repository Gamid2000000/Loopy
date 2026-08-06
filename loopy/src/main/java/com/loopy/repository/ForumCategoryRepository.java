package com.loopy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.loopy.model.ForumCategory;

public interface ForumCategoryRepository extends JpaRepository<ForumCategory, Long> {

    boolean existsBySlug(String slug);

    Optional<ForumCategory> findBySlug(String slug);
}
