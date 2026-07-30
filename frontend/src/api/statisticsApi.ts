import { apiClient } from "./apiClient";
import type { StatisticsOverviewResponse } from "../types/statistics";

export function getStatisticsOverview(days: number, signal?: AbortSignal): Promise<StatisticsOverviewResponse> {
  return apiClient<StatisticsOverviewResponse>(`/statistics/overview?days=${days}`, { signal });
}
