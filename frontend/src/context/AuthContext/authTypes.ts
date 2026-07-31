import type { CurrentUserResponse } from "../../types/user";
import type { LoginRequest, RegisterRequest } from "../../types/auth";
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";
export interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUserResponse | null;
  error: string | null;
  isLoading: boolean;
  login(data: LoginRequest): Promise<void>;
  register(data: RegisterRequest): Promise<void>;
  logout(): void;
  restoreSession(): Promise<void>;
  setUser(user: CurrentUserResponse | null): void;
}
