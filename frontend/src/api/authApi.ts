import { apiClient } from "./apiClient";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";
import type { CurrentUserResponse } from "../types/user";
export const authApi = {
  login: (data: LoginRequest) => apiClient<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: RegisterRequest) =>
    apiClient<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  currentUser: () => apiClient<CurrentUserResponse>("/users/me"),
};
