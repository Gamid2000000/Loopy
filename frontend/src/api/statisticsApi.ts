import { apiClient } from "./apiClient";
import type { StatisticsOverviewResponse, StatisticsPeriod } from "../types/statistics";

export function getStatisticsOverview(
  days: StatisticsPeriod,
  signal?: AbortSignal,
): Promise<StatisticsOverviewResponse> {
  return apiClient<StatisticsOverviewResponse>(`/statistics/overview?days=${days}`, { signal });
}
