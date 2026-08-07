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
public class UpdateForumTopicRequest {

    @NotBlank(message = "Forum topic title is required")
    @Size(min = 5, max = 160, message = "Forum topic title must be between 5 and 160 characters")
    private String title;

    @NotNull(message = "Version is required")
    private Long version;
}
