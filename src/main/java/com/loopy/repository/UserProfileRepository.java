package com.loopy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.loopy.model.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(Long userId);
}
