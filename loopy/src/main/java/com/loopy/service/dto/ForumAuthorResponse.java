package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ForumAuthorResponse {
    private Long id;
    private String username;
}
