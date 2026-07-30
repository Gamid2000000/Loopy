import { apiClient } from "./apiClient";
import type { DashboardResponse } from "../types/dashboard";

export function getDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return apiClient<DashboardResponse>("/dashboard", { signal });
}
