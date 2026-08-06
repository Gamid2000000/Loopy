package com.loopy.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateForumTopicRequest {
    @NotBlank(message = "Forum topic title is required")
    @Size(min = 5, max = 160, message = "Forum topic title must contain 5 to 160 characters")
    private String title;

    @NotBlank(message = "Forum post content is required")
    @Size(min = 10, max = 10000, message = "Forum post content must contain 10 to 10000 characters")
    private String content;
}
