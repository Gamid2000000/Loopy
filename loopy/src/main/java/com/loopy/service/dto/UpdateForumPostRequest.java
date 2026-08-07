package com.loopy.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateForumPostRequest {

    @NotBlank(message = "Forum post content is required")
    @Size(min = 10, max = 10000, message = "Forum post content must be between 10 and 10000 characters")
    private String content;

    @NotNull(message = "Version is required")
    private Long version;
}
