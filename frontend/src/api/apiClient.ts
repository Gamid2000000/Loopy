import { ApiError } from "./apiError";
import { tokenStorage } from "../services/tokenStorage";
import type { BackendErrorResponse } from "../types/backendError";
import { notifyAuthFailure } from "./authFailure";
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = (await response.json().catch(() => null)) as T | BackendErrorResponse | null;
    if (!response.ok) {
      const error = body as BackendErrorResponse | null;
      if (response.status === 401) notifyAuthFailure();
      throw new ApiError(
        error?.code ?? "HTTP_ERROR",
        error?.message ?? response.statusText,
        error?.status ?? response.status,
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("NETWORK_ERROR", "Не удалось подключиться к серверу.", 0, true);
  }
}
