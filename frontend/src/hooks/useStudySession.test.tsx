import { act, render, waitFor } from "@testing-library/react";
import { ApiError } from "../api/apiError";
import * as sessionsApi from "../api/studySessionsApi";
import * as reviewsApi from "../api/reviewsApi";
import type { SubmitReviewResponse } from "../types/review";
import { useStudySession } from "./useStudySession";

vi.mock("../api/studySessionsApi");
vi.mock("../api/reviewsApi");

const active = {
  id: 8,
  deckId: 3,
  deckName: "Deck",
  status: "ACTIVE",
  reviewCardsCount: 0,
  newCardsCount: 2,
  totalCardsCount: 2,
  currentPosition: 1,
  remainingCardsCount: 2,
  startedAt: "2026-01-01T00:00:00Z",
  completedAt: null,
  cancelledAt: null,
} as const;
const completed = {
  ...active,
  status: "COMPLETED",
  currentPosition: null,
  remainingCardsCount: 0,
  completedAt: "2026-01-01T00:05:00Z",
} as const;
const cardA = {
  sessionId: 8,
  sessionCardId: 81,
  cardId: 1,
  position: 1,
  total: 2,
  type: "NEW",
  front: "A",
  back: "Answer A",
  example: null,
  note: null,
} as const;
const cardB = { ...cardA, sessionCardId: 82, cardId: 2, position: 2, front: "B" } as const;
const review = (
  nextCard: typeof cardB | null = cardB,
  status: "ACTIVE" | "COMPLETED" = "ACTIVE",
): SubmitReviewResponse => ({
  review: {
    id: 1,
    cardId: 1,
    grade: "GOOD",
    sm2Score: 4,
    previousEaseFactor: 2.5,
    newEaseFactor: 2.5,
    previousIntervalDays: 0,
    newIntervalDays: 1,
    previousConsecutiveCorrectCount: 0,
    newConsecutiveCorrectCount: 1,
    previousDueAt: null,
    nextReviewAt: "2026-01-02T00:00:00Z",
    reviewedAt: "2026-01-01T00:00:00Z",
  },
  session: {
    sessionId: 8,
    status,
    currentPosition: nextCard ? nextCard.position : null,
    completedCardsCount: nextCard ? 1 : 2,
    remainingCardsCount: nextCard ? 1 : 0,
    totalCardsCount: 2,
  },
  nextCard,
});

let value: ReturnType<typeof useStudySession>;
function Probe({ id }: { id: number | null }) {
  // Test probe intentionally exposes the hook value to the assertions.
  // eslint-disable-next-line react-hooks/globals
  value = useStudySession(id);
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sessionsApi.getStudySession).mockResolvedValue(active);
  vi.mocked(sessionsApi.getCurrentStudyCard).mockResolvedValue(cardA);
  vi.mocked(reviewsApi.submitReview).mockResolvedValue(review());
  vi.mocked(sessionsApi.cancelStudySession).mockResolvedValue(undefined);
  vi.spyOn(performance, "now").mockReturnValue(1_000);
  vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValueOnce("uuid-a").mockReturnValueOnce("uuid-b") });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("loads an ACTIVE session and its current card, but never loads a terminal or invalid session card", async () => {
  const view = render(<Probe id={8} />);
  await waitFor(() => expect(value.currentCard).toEqual(cardA));
  expect(sessionsApi.getCurrentStudyCard).toHaveBeenCalledTimes(1);
  view.rerender(<Probe id={null} />);
  await waitFor(() => expect(value.status).toBe("error"));
  expect(sessionsApi.getStudySession).toHaveBeenCalledTimes(1);
  vi.mocked(sessionsApi.getStudySession).mockResolvedValue(completed);
  view.rerender(<Probe id={9} />);
  await waitFor(() => expect(value.session?.status).toBe("COMPLETED"));
  expect(sessionsApi.getCurrentStudyCard).toHaveBeenCalledTimes(1);
});

it("keeps answer UI local and sends one timed review with the response next card", async () => {
  render(<Probe id={8} />);
  await waitFor(() => expect(value.currentCard).toEqual(cardA));
  act(() => value.revealAnswer());
  expect(value.isAnswerRevealed).toBe(true);
  vi.mocked(performance.now).mockReturnValue(2_200);
  await act(async () => value.submitGrade("GOOD"));
  expect(reviewsApi.submitReview).toHaveBeenCalledWith(
    8,
    expect.objectContaining({ grade: "GOOD", clientReviewId: "uuid-a", responseTimeMs: 1200 }),
  );
  expect(value.currentCard).toEqual(cardB);
  expect(value.isAnswerRevealed).toBe(false);
  expect(sessionsApi.getCurrentStudyCard).toHaveBeenCalledTimes(1);
});

it("retains the exact UUID and response time for network retry, then uses a new UUID", async () => {
  vi.mocked(reviewsApi.submitReview)
    .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "offline", 0, true))
    .mockResolvedValueOnce(review())
    .mockResolvedValueOnce(review(null, "COMPLETED"));
  render(<Probe id={8} />);
  await waitFor(() => expect(value.currentCard).toEqual(cardA));
  act(() => value.revealAnswer());
  vi.mocked(performance.now).mockReturnValue(1_500);
  await act(async () => value.submitGrade("EASY"));
  expect(value.pendingReview).toEqual(
    expect.objectContaining({ clientReviewId: "uuid-a", responseTimeMs: 500, grade: "EASY" }),
  );
  await act(async () => value.retryReview());
  expect(vi.mocked(reviewsApi.submitReview).mock.calls[1][1]).toEqual(
    vi.mocked(reviewsApi.submitReview).mock.calls[0][1],
  );
  act(() => value.revealAnswer());
  await act(async () => value.submitGrade("HARD"));
  expect(vi.mocked(reviewsApi.submitReview).mock.calls[2][1].clientReviewId).toBe("uuid-b");
});

it("does not double-submit a grade and preserves ACTIVE state after cancel error", async () => {
  let resolve!: (result: SubmitReviewResponse) => void;
  vi.mocked(reviewsApi.submitReview).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<Probe id={8} />);
  await waitFor(() => expect(value.currentCard).toEqual(cardA));
  act(() => value.revealAnswer());
  act(() => {
    value.submitGrade("AGAIN");
    value.submitGrade("AGAIN");
  });
  expect(reviewsApi.submitReview).toHaveBeenCalledTimes(1);
  await act(async () => resolve(review()));
  vi.mocked(sessionsApi.cancelStudySession).mockRejectedValueOnce(new ApiError("HTTP_ERROR", "no", 500));
  await act(async () => expect(value.cancelSession()).resolves.toBe(false));
  expect(value.session?.status).toBe("ACTIVE");
});
