import { apiClient } from "./apiClient";
import type { UpdateUserProfileRequest, UserProfileResponse } from "../types/user";

export const profileApi = {
  updateProfile: (data: UpdateUserProfileRequest) =>
    apiClient<UserProfileResponse>("/users/me/profile", { method: "PATCH", body: JSON.stringify(data) }),
};
