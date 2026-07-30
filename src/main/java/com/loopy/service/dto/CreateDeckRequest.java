package com.loopy.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDeckRequest {

    @NotBlank(message = "Deck name is required")
    @Size(max = 100, message = "Deck name must not exceed 100 characters")
    private String name;

    @Size(max = 1000, message = "Deck description must not exceed 1000 characters")
    private String description;

    private Boolean isPublic;
}
