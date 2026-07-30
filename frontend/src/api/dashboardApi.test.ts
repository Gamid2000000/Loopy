import { getDashboard } from "./dashboardApi";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));
});

afterEach(() => vi.unstubAllGlobals());

it("requests the dashboard endpoint", async () => {
  await getDashboard();

  expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/dashboard", expect.any(Object));
});
