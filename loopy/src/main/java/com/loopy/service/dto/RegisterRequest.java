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
public class RegisterRequest {

	@NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

	@NotBlank(message = "Email is required")
	@Pattern(regexp = "\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*")
	@Size(max = 320)
	private String email;

	@NotBlank(message = "Password is required")
    @Size(min = 8, max = 72)
    private String password;
}
