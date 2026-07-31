import type { CurrentStudyCardResponse, StudySessionStatus } from "./studySession";

export type ReviewGrade = "AGAIN" | "HARD" | "GOOD" | "EASY";
export interface SubmitReviewRequest {
  sessionCardId: number;
  grade: ReviewGrade;
  responseTimeMs: number;
  clientReviewId: string;
}
export interface SessionProgressResponse {
  sessionId: number;
  status: StudySessionStatus;
  currentPosition: number | null;
  completedCardsCount: number;
  remainingCardsCount: number;
  totalCardsCount: number;
}
export interface ReviewResultResponse {
  id: number;
  cardId: number;
  grade: ReviewGrade;
  sm2Score: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  previousIntervalDays: number;
  newIntervalDays: number;
  previousConsecutiveCorrectCount: number;
  newConsecutiveCorrectCount: number;
  previousDueAt: string | null;
  nextReviewAt: string;
  reviewedAt: string;
}
export interface SubmitReviewResponse {
  review: ReviewResultResponse;
  session: SessionProgressResponse;
  nextCard: CurrentStudyCardResponse | null;
}
