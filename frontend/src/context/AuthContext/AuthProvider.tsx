import { useCallback, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../../api/authApi";
import { ApiError } from "../../api/apiError";
import { tokenStorage } from "../../services/tokenStorage";
import type { LoginRequest, RegisterRequest } from "../../types/auth";
import type { CurrentUserResponse } from "../../types/user";
import { AuthContext } from "./AuthContext";
import type { AuthStatus } from "./authTypes";
import { subscribeToAuthFailure } from "../../api/authFailure";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const restoreSession = useCallback(async () => {
    if (!tokenStorage.getToken()) {
      setStatus("unauthenticated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setUser(await authApi.currentUser());
      setStatus("authenticated");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        tokenStorage.clearToken();
        setStatus("unauthenticated");
      } else {
        setError("Сессия не восстановлена. Проверьте подключение и повторите попытку.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void restoreSession());
  }, [restoreSession]);

  useEffect(
    () =>
      subscribeToAuthFailure(() => {
        tokenStorage.clearToken();
        setUser(null);
        setError(null);
        setStatus("unauthenticated");
      }),
    [],
  );

  const authenticate = async (data: LoginRequest | RegisterRequest, isRegister: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = isRegister ? await authApi.register(data as RegisterRequest) : await authApi.login(data);
      tokenStorage.setToken(response.accessToken);
      setUser(await authApi.currentUser());
      setStatus("authenticated");
    } catch (caught) {
      tokenStorage.clearToken();
      setStatus("unauthenticated");
      setError(caught instanceof Error ? caught.message : "Не удалось выполнить вход.");
      throw caught;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext
      value={{
        status,
        user,
        error,
        isLoading,
        login: (data) => authenticate(data, false),
        register: (data) => authenticate(data, true),
        logout: () => {
          tokenStorage.clearToken();
          setUser(null);
          setError(null);
          setStatus("unauthenticated");
        },
        restoreSession,
      }}
    >
      {children}
    </AuthContext>
  );
}
