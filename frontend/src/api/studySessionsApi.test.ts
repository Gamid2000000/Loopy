import { cancelStudySession, createStudySession, getActiveStudySession, getCurrentStudyCard, getStudySession } from "./studySessionsApi";
import { submitReview } from "./reviewsApi";

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))));
afterEach(() => vi.unstubAllGlobals());

it("uses the confirmed study-session endpoints and review body", async () => {
  await createStudySession(7); await getStudySession(3); await getActiveStudySession(7); await getCurrentStudyCard(3);
  await submitReview(3, { sessionCardId: 11, grade: "GOOD", responseTimeMs: 42, clientReviewId: "a0f17c58-1b09-4d98-94e2-93a93e10ab58" }); await cancelStudySession(3);
  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/study-sessions", expect.objectContaining({ method: "POST", body: JSON.stringify({ deckId: 7 }) }));
  expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/study-sessions/3", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/study-sessions/active?deckId=7", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(4, "http://localhost:8080/api/study-sessions/3/current-card", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(5, "http://localhost:8080/api/study-sessions/3/reviews", expect.objectContaining({ method: "POST", body: JSON.stringify({ sessionCardId: 11, grade: "GOOD", responseTimeMs: 42, clientReviewId: "a0f17c58-1b09-4d98-94e2-93a93e10ab58" }) }));
  expect(fetch).toHaveBeenNthCalledWith(6, "http://localhost:8080/api/study-sessions/3/cancel", expect.objectContaining({ method: "POST" }));
});

it("accepts a no-content cancel response", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 }))); await expect(cancelStudySession(3)).resolves.toBeUndefined(); });
