import { apiClient } from "./apiClient";
import type { StudySessionResponse } from "../types/studySession";

export function createStudySession(deckId: number) {
  return apiClient<StudySessionResponse>("/study-sessions", { method: "POST", body: JSON.stringify({ deckId }) });
}
export function getStudySession(sessionId: number, signal?: AbortSignal) {
  return apiClient<StudySessionResponse>(`/study-sessions/${sessionId}`, { signal });
}
export async function getActiveStudySession(
  deckId: number,
  signal?: AbortSignal,
): Promise<StudySessionResponse | null> {
  try {
    return await apiClient<StudySessionResponse>(`/study-sessions/active?deckId=${deckId}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof Error && "code" in error && error.code === "STUDY_SESSION_NOT_FOUND") return null;
    throw error;
  }
}
export function getCurrentStudyCard(sessionId: number, signal?: AbortSignal) {
  return apiClient<import("../types/studySession").CurrentStudyCardResponse>(
    `/study-sessions/${sessionId}/current-card`,
    { signal },
  );
}
export function cancelStudySession(sessionId: number) {
  return apiClient<void>(`/study-sessions/${sessionId}/cancel`, { method: "POST" });
}
