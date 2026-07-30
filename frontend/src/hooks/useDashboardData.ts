import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import { getStatisticsOverview } from "../api/statisticsApi";
import { ApiError } from "../api/apiError";
import type { DashboardResponse } from "../types/dashboard";
import type { ActivityDay } from "../types/statistics";

export type LoadStatus = "idle" | "loading" | "success" | "error";
const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export function useDashboardData() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [dashboardStatus, setDashboardStatus] = useState<LoadStatus>("idle");
  const [activityStatus, setActivityStatus] = useState<LoadStatus>("idle");
  const [dashboardError, setDashboardError] = useState<ApiError | null>(null);
  const [activityError, setActivityError] = useState<ApiError | null>(null);
  const dashboardController = useRef<AbortController | null>(null);
  const activityController = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    if (dashboardController.current) return;
    const controller = new AbortController();
    dashboardController.current = controller;
    setDashboardStatus("loading");
    setDashboardError(null);
    try {
      setDashboard(await getDashboard(controller.signal));
      setDashboardStatus("success");
    } catch (error) {
      if (!isAbort(error)) {
        setDashboardError(error instanceof ApiError ? error : new ApiError("HTTP_ERROR", "", 0));
        setDashboardStatus("error");
      }
    } finally {
      if (dashboardController.current === controller) dashboardController.current = null;
    }
  }, []);
  const reloadActivity = useCallback(async () => {
    if (activityController.current) return;
    const controller = new AbortController();
    activityController.current = controller;
    setActivityStatus("loading");
    setActivityError(null);
    try {
      setActivity((await getStatisticsOverview(7, controller.signal)).activity);
      setActivityStatus("success");
    } catch (error) {
      if (!isAbort(error)) {
        setActivityError(error instanceof ApiError ? error : new ApiError("HTTP_ERROR", "", 0));
        setActivityStatus("error");
      }
    } finally {
      if (activityController.current === controller) activityController.current = null;
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      void reload();
      void reloadActivity();
    });
    return () => {
      dashboardController.current?.abort();
      activityController.current?.abort();
    };
  }, [reload, reloadActivity]);
  return {
    dashboard,
    activity,
    dashboardStatus,
    activityStatus,
    dashboardError,
    activityError,
    reload,
    reloadActivity,
  };
}
