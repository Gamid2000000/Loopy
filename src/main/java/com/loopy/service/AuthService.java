package com.loopy.service;

import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.loopy.exception.InvalidEmailOrPasswordException;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.model.User;
import com.loopy.security.JwtTokenProvider;
import com.loopy.service.dto.AuthResponse;
import com.loopy.service.dto.CreateUserDto;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider tokenProvider;
	private final UserService userService;

	public AuthResponse register(String name, String email, String password) {
		CreateUserDto userDto = new CreateUserDto();
		userDto.setName(name);
		userDto.setEmail(normalizeEmail(email));
		userDto.setPassword(passwordEncoder.encode(password));

		User savedUser = userService.createUser(userDto);

		return buildAuthResponse(savedUser);
	}

	public AuthResponse login(String email, String password) {
		User user = userService.get(normalizeEmail(email)).orElseThrow(() -> new InvalidEmailOrPasswordException(
				HttpResponseMessage.HTTP_INVALID_EMAIL_OR_PASSWORD.getMessage()));

		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new InvalidEmailOrPasswordException(
					HttpResponseMessage.HTTP_INVALID_EMAIL_OR_PASSWORD.getMessage());

		}

		return buildAuthResponse(user);
	}

	private AuthResponse buildAuthResponse(User user) {
		String accessToken = tokenProvider.generateToken(user.getEmail());

		return new AuthResponse(accessToken, "Bearer", tokenProvider.getJwtExpirationMs());
	}

	public static String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
