import { apiClient } from "./apiClient";
import type { SubmitReviewRequest, SubmitReviewResponse } from "../types/review";
export function submitReview(sessionId: number, request: SubmitReviewRequest) {
  return apiClient<SubmitReviewResponse>(`/study-sessions/${sessionId}/reviews`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
