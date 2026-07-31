import { profileApi } from "./profileApi";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          displayName: "Test",
          nativeLanguage: "en",
          learningLanguage: "es",
          timezone: "UTC",
          dailyNewCardsLimit: 10,
          dailyReviewLimit: 100,
        }),
        { status: 200 },
      ),
    ),
  );
});

afterEach(() => vi.unstubAllGlobals());

it("uses PATCH /users/me/profile endpoint", async () => {
  await profileApi.updateProfile({ timezone: "Europe/Warsaw" });
  const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(callArgs[0]).toMatch(/\/api\/users\/me\/profile$/);
  expect(callArgs[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
});

it("sends JSON body", async () => {
  await profileApi.updateProfile({ timezone: "Europe/Warsaw" });
  const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(callArgs[1].body).toBe(JSON.stringify({ timezone: "Europe/Warsaw" }));
});

it("preserves zero in dailyNewCardsLimit", async () => {
  await profileApi.updateProfile({ dailyNewCardsLimit: 0 });
  const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(callArgs[1].body).toBe(JSON.stringify({ dailyNewCardsLimit: 0 }));
});

it("sends null for language when explicitly set to null", async () => {
  await profileApi.updateProfile({ nativeLanguage: null });
  const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(callArgs[1].body).toBe(JSON.stringify({ nativeLanguage: null }));
});

it("attaches Bearer JWT via shared apiClient", async () => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => (key === "loopy.access-token" ? "test-jwt" : null)),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
  await profileApi.updateProfile({ timezone: "UTC" });
  const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(callArgs[1].headers).toEqual(expect.objectContaining({ Authorization: "Bearer test-jwt" }));
});
