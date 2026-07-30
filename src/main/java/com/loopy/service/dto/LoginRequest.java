package com.loopy.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Pattern(regexp = "\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*")
    @Size(max = 320)
    private String email;

    @NotBlank(message = "password is required")
    @Size(max = 72)
    private String password;
}
