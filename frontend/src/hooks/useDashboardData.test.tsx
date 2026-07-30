import { act, renderHook, waitFor } from "@testing-library/react";
import { ApiError } from "../api/apiError";
import { getDashboard } from "../api/dashboardApi";
import { getStatisticsOverview } from "../api/statisticsApi";
import { dashboardMock } from "../mocks/dashboardMock";
import { useDashboardData } from "./useDashboardData";

vi.mock("../api/dashboardApi", () => ({ getDashboard: vi.fn() }));
vi.mock("../api/statisticsApi", () => ({ getStatisticsOverview: vi.fn() }));

const activity = [{ date: "2026-07-30", answersCount: 2, successfulAnswersCount: 2, studyTimeMs: 1000 }];
const dashboardApi = vi.mocked(getDashboard);
const statisticsApi = vi.mocked(getStatisticsOverview);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  dashboardApi.mockReset();
  statisticsApi.mockReset();
});

it("starts in loading state", async () => {
  dashboardApi.mockReturnValue(new Promise(() => {}));
  statisticsApi.mockReturnValue(new Promise(() => {}));
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => {
    expect(result.current.dashboardStatus).toBe("loading");
    expect(result.current.activityStatus).toBe("loading");
  });
});

it("loads dashboard and activity successfully", async () => {
  dashboardApi.mockResolvedValue(dashboardMock);
  statisticsApi.mockResolvedValue({ activity } as Awaited<ReturnType<typeof getStatisticsOverview>>);
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(result.current.dashboardStatus).toBe("success"));

  expect(result.current.dashboard).toEqual(dashboardMock);
  expect(result.current.activityStatus).toBe("success");
  expect(result.current.activity).toEqual(activity);
  expect(statisticsApi).toHaveBeenCalledWith(7, expect.any(AbortSignal));
});

it("reports a complete dashboard error", async () => {
  const error = new ApiError("HTTP_ERROR", "Dashboard unavailable", 500);
  dashboardApi.mockRejectedValue(error);
  statisticsApi.mockResolvedValue({ activity } as Awaited<ReturnType<typeof getStatisticsOverview>>);
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(result.current.dashboardStatus).toBe("error"));

  expect(result.current.dashboard).toBeNull();
  expect(result.current.dashboardError).toBe(error);
});

it("keeps dashboard data visible when activity fails", async () => {
  dashboardApi.mockResolvedValue(dashboardMock);
  statisticsApi.mockRejectedValue(new ApiError("HTTP_ERROR", "Activity unavailable", 500));
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(result.current.activityStatus).toBe("error"));

  expect(result.current.dashboard).toEqual(dashboardMock);
  expect(result.current.dashboardStatus).toBe("success");
});

it("retries a failed dashboard request", async () => {
  dashboardApi
    .mockRejectedValueOnce(new ApiError("HTTP_ERROR", "Unavailable", 500))
    .mockResolvedValueOnce(dashboardMock);
  statisticsApi.mockResolvedValue({ activity } as Awaited<ReturnType<typeof getStatisticsOverview>>);
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(result.current.dashboardStatus).toBe("error"));
  await act(async () => result.current.reload());

  expect(result.current.dashboardStatus).toBe("success");
  expect(result.current.dashboard).toEqual(dashboardMock);
  expect(dashboardApi).toHaveBeenCalledTimes(2);
});

it("retries a failed activity request", async () => {
  dashboardApi.mockResolvedValue(dashboardMock);
  statisticsApi
    .mockRejectedValueOnce(new ApiError("HTTP_ERROR", "Unavailable", 500))
    .mockResolvedValueOnce({ activity } as Awaited<ReturnType<typeof getStatisticsOverview>>);
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(result.current.activityStatus).toBe("error"));
  await act(async () => result.current.reloadActivity());

  expect(result.current.activityStatus).toBe("success");
  expect(result.current.activity).toEqual(activity);
  expect(statisticsApi).toHaveBeenCalledTimes(2);
});

it("does not start parallel dashboard refreshes", async () => {
  const pending = deferred<typeof dashboardMock>();
  dashboardApi.mockReturnValue(pending.promise);
  statisticsApi.mockReturnValue(new Promise(() => {}));
  const { result } = renderHook(() => useDashboardData());

  await waitFor(() => expect(dashboardApi).toHaveBeenCalledTimes(1));
  await act(async () => {
    void result.current.reload();
    void result.current.reload();
  });

  expect(dashboardApi).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(dashboardMock));
});

it("aborts in-flight requests on unmount without reporting an error", async () => {
  let dashboardSignal: AbortSignal | undefined;
  let activitySignal: AbortSignal | undefined;
  dashboardApi.mockImplementation((signal) => {
    dashboardSignal = signal;
    return new Promise(() => {});
  });
  statisticsApi.mockImplementation((_days, signal) => {
    activitySignal = signal;
    return new Promise(() => {});
  });
  const { unmount } = renderHook(() => useDashboardData());

  await waitFor(() => expect(dashboardSignal).toBeDefined());
  unmount();

  expect(dashboardSignal?.aborted).toBe(true);
  expect(activitySignal?.aborted).toBe(true);
});
