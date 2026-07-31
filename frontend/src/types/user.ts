export interface UserProfileResponse {
  displayName: string;
  nativeLanguage: string;
  learningLanguage: string;
  timezone: string;
  dailyNewCardsLimit: number;
  dailyReviewLimit: number;
}

export interface CurrentUserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profile: UserProfileResponse;
}

export interface UpdateUserProfileRequest {
  displayName?: string;
  nativeLanguage?: string | null;
  learningLanguage?: string | null;
  timezone?: string;
  dailyNewCardsLimit?: number;
  dailyReviewLimit?: number;
}
