export type StudySessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface StudyAvailability {
  dueReviewCardsCount: number;
  newCardsCount: number;
  reviewCardsQueuedToday: number;
  newCardsQueuedToday: number;
  dailyReviewLimit: number;
  dailyNewCardsLimit: number;
  remainingReviewLimit: number;
  remainingNewLimit: number;
  availableReviewCardsCount: number;
  availableNewCardsCount: number;
}

export interface TodayStudy {
  answeredCardsCount: number;
  completedSessionsCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  successfulAnswersCount: number;
  successRate: number;
  studyTimeMs: number;
}

export interface CardStateDistribution {
  activeCardsCount: number;
  newCardsCount: number;
  dueCardsCount: number;
  scheduledCardsCount: number;
}

export interface ActiveStudySession {
  sessionId: number;
  deckId: number;
  deckName: string;
  completedCardsCount: number;
  totalCardsCount: number;
  remainingCardsCount: number;
  startedAt: string;
  currentPosition: number;
}

export interface RecentStudySession {
  sessionId: number;
  deckId: number;
  deckName: string;
  status: StudySessionStatus;
  completedCardsCount: number;
  totalCardsCount: number;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
}

export interface Streak {
  currentDays: number;
  longestDays: number;
}

export interface DashboardResponse {
  generatedAt: string;
  timezone: string;
  localDate: string;
  availability: StudyAvailability;
  today: TodayStudy;
  cardStates: CardStateDistribution;
  activeSessions: ActiveStudySession[];
  recentSessions: RecentStudySession[];
  streak: Streak;
}
