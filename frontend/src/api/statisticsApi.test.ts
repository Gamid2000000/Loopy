import { ApiError } from "./apiError";
import { getStatisticsOverview } from "./statisticsApi";
import { tokenStorage } from "../services/tokenStorage";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));
  tokenStorage.clearToken();
});
afterEach(() => vi.unstubAllGlobals());

it.each([7, 30, 90] as const)("requests overview for %s days", async (days) => {
  await getStatisticsOverview(days);
  expect(fetch).toHaveBeenCalledWith(`http://localhost:8080/api/statistics/overview?days=${days}`, expect.any(Object));
});

it("delegates bearer authentication to apiClient", async () => {
  tokenStorage.setToken("token");
  await getStatisticsOverview(30);
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }),
  );
});

it("keeps backend errors as ApiError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "X", message: "No", status: 500 }), { status: 500 })),
  );
  await expect(getStatisticsOverview(7)).rejects.toBeInstanceOf(ApiError);
});

it("does not convert AbortError into ApiError", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));
  await expect(getStatisticsOverview(7)).rejects.toMatchObject({ name: "AbortError" });
});
