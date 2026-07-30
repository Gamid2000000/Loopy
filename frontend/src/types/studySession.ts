export type StudySessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type StudyCardType = "REVIEW" | "NEW";

export interface CreateStudySessionRequest { deckId: number; }
export interface StudySessionResponse {
  id: number; deckId: number; deckName: string; status: StudySessionStatus;
  reviewCardsCount: number; newCardsCount: number; totalCardsCount: number;
  currentPosition: number | null; remainingCardsCount: number;
  startedAt: string; completedAt: string | null; cancelledAt: string | null;
}
export interface CurrentStudyCardResponse {
  sessionId: number; sessionCardId: number; cardId: number; position: number; total: number;
  type: StudyCardType; front: string; back: string; example: string | null; note: string | null;
}
