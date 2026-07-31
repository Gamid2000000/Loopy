import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/apiError";
import { getStatisticsOverview } from "../api/statisticsApi";
import type { StatisticsOverviewResponse, StatisticsPeriod } from "../types/statistics";

export type LoadStatus = "idle" | "loading" | "success" | "error";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useStatistics() {
  const [period, setPeriodState] = useState<StatisticsPeriod>(30);
  const [statistics, setStatistics] = useState<StatisticsOverviewResponse | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (nextPeriod: StatisticsPeriod, replace = false) => {
    if (controllerRef.current && !replace) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;
    setStatistics(null);
    setStatus("loading");
    setError(null);
    try {
      const response = await getStatisticsOverview(nextPeriod, controller.signal);
      if (requestId !== requestIdRef.current) return;
      setStatistics(response);
      setStatus("success");
    } catch (nextError) {
      if (requestId !== requestIdRef.current || isAbortError(nextError)) return;
      setError(nextError instanceof ApiError ? nextError : new ApiError("HTTP_ERROR", "", 0));
      setStatus("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  const setPeriod = useCallback(
    (nextPeriod: StatisticsPeriod) => {
      if (nextPeriod === period) return;
      setPeriodState(nextPeriod);
      void load(nextPeriod, true);
    },
    [load, period],
  );

  const reload = useCallback(() => {
    if (controllerRef.current) return;
    void load(period);
  }, [load, period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(30);
    return () => controllerRef.current?.abort();
  }, [load]);

  return { period, statistics, status, error, isRefreshing: status === "loading", setPeriod, reload };
}
