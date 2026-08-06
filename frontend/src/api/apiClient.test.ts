import { apiClient } from "./apiClient";
import { tokenStorage } from "../services/tokenStorage";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

it("adds the bearer token to API requests", async () => {
  tokenStorage.setToken("access-token");
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

  await apiClient("/dashboard");

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8081/api/dashboard",
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer access-token" }) }),
  );
});

it("converts a backend error response into ApiError", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ code: "VALIDATION_ERROR", message: "Invalid request", status: 400 }), {
      status: 400,
    }),
  );

  await expect(apiClient("/dashboard")).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
    message: "Invalid request",
    status: 400,
  });
});

it("preserves AbortError so it is not shown as a user-facing API error", async () => {
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  vi.mocked(fetch).mockRejectedValue(abortError);

  await expect(apiClient("/dashboard")).rejects.toBe(abortError);
});
