export type StatisticsPeriod = 7 | 30 | 90;

export interface StatisticsActivityDayResponse {
  date: string;
  answersCount: number;
  successfulAnswersCount: number;
  studyTimeMs: number;
}

export interface GradeDistributionResponse {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface StatisticsStreakResponse {
  currentDays: number;
  longestDays: number;
}

export interface StatisticsOverviewResponse {
  timezone: string;
  fromDate: string;
  toDate: string;
  totalAnswers: number;
  successfulAnswers: number;
  successRate: number;
  totalStudyTimeMs: number;
  averageResponseTimeMs: number;
  completedSessions: number;
  gradeDistribution: GradeDistributionResponse;
  streak: StatisticsStreakResponse;
  activity: StatisticsActivityDayResponse[];
}

export type ActivityDay = StatisticsActivityDayResponse;
