package com.loopy.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.loopy.exception.UserAlreadyExistException;
import com.loopy.exception.UserNotFoundException;
import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.exception_handler.enumeration.HttpResponseMessage;
import com.loopy.repository.UserRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.service.dto.CreateUserDto;
import com.loopy.service.dto.CurrentUserResponse;
import com.loopy.service.dto.UpdateUserProfileRequest;
import com.loopy.service.dto.UserProfileResponse;
import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final UserProfileRepository userProfileRepository;

	public Optional<User> get(Long id) {
		return userRepository.findById(id);
	}

	public Optional<User> get(String email) {
		return userRepository.findByEmail(AuthService.normalizeEmail(email));
	}

	public User getWithException(String email) {
		return userRepository.findByEmail(email).orElseThrow(() -> {
			return new UserNotFoundException(HttpResponseMessage.HTTP_USER_NOT_FOUND.getMessage());
		});
	}

	public User getWithException(Long id) {
		return userRepository.findById(id).orElseThrow(() -> {
			return new UserNotFoundException(HttpResponseMessage.HTTP_USER_NOT_FOUND.getMessage());
		});
	}

	@Transactional
	public User createUser(CreateUserDto dto) {
		dto.setEmail(AuthService.normalizeEmail(dto.getEmail()));
		get(dto.getEmail()).ifPresent(existing -> {
			throw new UserAlreadyExistException(HttpResponseMessage.HTTP_USER_ALREADY_EXIST.getMessage());
		});

		User user = userRepository.save(userWrapper(dto));

		UserProfile profile = new UserProfile();
		profile.setUser(user);
		profile.setDisplayName(user.getName());
		profile.setTimezone("UTC");
		profile.setDailyNewCardsLimit(20);
		profile.setDailyReviewLimit(100);
		userProfileRepository.save(profile);
		return user;
	}

	private User userWrapper(CreateUserDto dto) {
		return User.builder()
			.name(dto.getName().trim())
			.email(dto.getEmail())
			.passwordHash(dto.getPassword())
			.build();
	}

	public CurrentUserResponse getCurrentUser(String email) {
		User user = getWithException(email);
		return new CurrentUserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(),
			toProfile(userProfileRepository.findByUserId(user.getId()).orElseThrow(() -> new UserNotFoundException(HttpResponseMessage.HTTP_USER_PROFILE_NOT_FOUND.getMessage()))));
	}

	@Transactional
	public UserProfileResponse updateCurrentUserProfile(String email, UpdateUserProfileRequest request) {
		User user = getWithException(email);
		UserProfile profile = userProfileRepository.findByUserId(user.getId())
				.orElseThrow(() -> new UserNotFoundException(HttpResponseMessage.HTTP_USER_PROFILE_NOT_FOUND.getMessage()));
		if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName().trim());
		if (request.getNativeLanguage() != null) profile.setNativeLanguage(request.getNativeLanguage());
		if (request.getLearningLanguage() != null) profile.setLearningLanguage(request.getLearningLanguage());
		if (request.getTimezone() != null) profile.setTimezone(request.getTimezone());
		if (request.getDailyNewCardsLimit() != null) profile.setDailyNewCardsLimit(request.getDailyNewCardsLimit());
		if (request.getDailyReviewLimit() != null) profile.setDailyReviewLimit(request.getDailyReviewLimit());

		userProfileRepository.save(profile);
		return toProfile(profile);
	}

	private UserProfileResponse toProfile(UserProfile profile) {
		return new UserProfileResponse(profile.getDisplayName(), profile.getNativeLanguage(), profile.getLearningLanguage(),
				profile.getTimezone(), profile.getDailyNewCardsLimit(), profile.getDailyReviewLimit());
	}

}
