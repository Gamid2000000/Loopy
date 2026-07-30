import { getStatisticsOverview } from "./statisticsApi";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));
});

afterEach(() => vi.unstubAllGlobals());

it("requests the statistics overview endpoint with the selected period", async () => {
  await getStatisticsOverview(7);

  expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/statistics/overview?days=7", expect.any(Object));
});
