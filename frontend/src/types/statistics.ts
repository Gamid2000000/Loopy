import type { Streak } from "./dashboard";

export interface ActivityDay {
  date: string;
  answersCount: number;
  successfulAnswersCount: number;
  studyTimeMs: number;
}

export interface GradeDistribution {
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
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
  gradeDistribution: GradeDistribution;
  streak: Streak;
  activity: ActivityDay[];
}
