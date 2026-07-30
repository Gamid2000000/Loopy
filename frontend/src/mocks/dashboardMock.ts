import type { DashboardResponse } from "../types/dashboard";
import type { ActivityDay } from "../types/statistics";
export const activityMock: ActivityDay[] = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((_, i) => ({
  date: `2026-07-${String(20 + i).padStart(2, "0")}`,
  answersCount: [12, 19, 15, 31, 38, 24, 17][i],
  successfulAnswersCount: [10, 16, 12, 28, 34, 20, 15][i],
  studyTimeMs: 600000,
}));
export const dashboardMock: DashboardResponse = {
  generatedAt: "2026-07-30T08:00:00Z",
  timezone: "Asia/Yekaterinburg",
  localDate: "2026-07-30",
  availability: {
    dueReviewCardsCount: 18,
    newCardsCount: 5,
    reviewCardsQueuedToday: 30,
    newCardsQueuedToday: 8,
    dailyReviewLimit: 100,
    dailyNewCardsLimit: 10,
    remainingReviewLimit: 70,
    remainingNewLimit: 2,
    availableReviewCardsCount: 18,
    availableNewCardsCount: 5,
  },
  today: {
    answeredCardsCount: 24,
    completedSessionsCount: 2,
    againCount: 2,
    hardCount: 4,
    goodCount: 14,
    easyCount: 4,
    successfulAnswersCount: 21,
    successRate: 87.5,
    studyTimeMs: 1080000,
  },
  cardStates: { activeCardsCount: 198, newCardsCount: 5, dueCardsCount: 18, scheduledCardsCount: 175 },
  activeSessions: [
    {
      sessionId: 1,
      deckId: 1,
      deckName: "English B1",
      completedCardsCount: 12,
      totalCardsCount: 30,
      remainingCardsCount: 18,
      startedAt: "2026-07-30T07:30:00Z",
      currentPosition: 13,
    },
  ],
  recentSessions: [
    {
      sessionId: 4,
      deckId: 1,
      deckName: "English B1",
      status: "COMPLETED",
      completedCardsCount: 20,
      totalCardsCount: 20,
      startedAt: "2026-07-29T09:00:00Z",
      completedAt: "2026-07-29T09:18:00Z",
      durationSeconds: 1080,
    },
  ],
  streak: { currentDays: 12, longestDays: 18 },
};
