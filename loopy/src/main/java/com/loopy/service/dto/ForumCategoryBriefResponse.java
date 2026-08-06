package com.loopy.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ForumCategoryBriefResponse {
    private Long id;
    private String slug;
    private String name;
}
