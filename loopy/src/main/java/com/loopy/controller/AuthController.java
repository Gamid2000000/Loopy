package com.loopy.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.loopy.security.dto.UserPrincipal;
import com.loopy.service.AuthService;
import com.loopy.service.dto.AuthResponse;
import com.loopy.service.dto.LoginRequest;
import com.loopy.service.dto.RegisterRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(
				authService.register(request.getName(), request.getEmail(), request.getPassword()));
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request.getEmail(), request.getPassword());
	}


	@GetMapping("me")
	public ResponseEntity<String> myUser(@AuthenticationPrincipal UserPrincipal principal) {
		return ResponseEntity.ok(principal.getEmail());
	}
}
