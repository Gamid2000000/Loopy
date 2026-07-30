package com.loopy.service.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CurrentUserResponse {

    private Long id;
    private String name;
    private String email;
    private Instant createdAt;
    private UserProfileResponse profile;
}
