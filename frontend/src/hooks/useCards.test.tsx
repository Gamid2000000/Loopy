import { act, renderHook, waitFor } from "@testing-library/react";
import * as cardsApi from "../api/cardsApi";
import * as decksApi from "../api/decksApi";
import { useCards } from "./useCards";
import type { CardResponse, PageResponse } from "../types/card";

vi.mock("../api/cardsApi");
vi.mock("../api/decksApi");

const deck = {
  id: 1,
  name: "Deck",
  description: null,
  isPublic: false,
  status: "ACTIVE" as const,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const card = (id: number): CardResponse => ({
  id,
  deckId: 1,
  front: `front ${id}`,
  back: `back ${id}`,
  example: null,
  note: null,
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const page = (id: number, number: number): PageResponse<CardResponse> => ({
  content: [card(id)],
  number,
  size: 50,
  totalElements: 2,
  totalPages: 2,
  first: number === 0,
  last: number === 1,
  empty: false,
});
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

beforeEach(() => {
  vi.mocked(decksApi.getDeck).mockResolvedValue(deck);
  vi.mocked(cardsApi.getActiveCards).mockResolvedValue(page(1, 0));
  vi.mocked(cardsApi.getCard).mockResolvedValue(card(1));
});
afterEach(() => vi.clearAllMocks());

it("does not let an obsolete list response replace the selected page", async () => {
  const first = deferred<PageResponse<CardResponse>>();
  const second = deferred<PageResponse<CardResponse>>();
  vi.mocked(cardsApi.getActiveCards)
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(cardsApi.getActiveCards).toHaveBeenCalledTimes(1));
  act(() => result.current.changePage(1));
  await waitFor(() => expect(cardsApi.getActiveCards).toHaveBeenCalledTimes(2));
  await act(async () => {
    second.resolve(page(2, 1));
    await second.promise;
  });
  await act(async () => {
    first.resolve(page(1, 0));
    await first.promise;
  });
  expect(result.current.active.number).toBe(1);
  expect(result.current.active.content[0]?.id).toBe(2);
});

it("does not let an obsolete detail response replace the latest preview", async () => {
  const first = deferred<CardResponse>();
  const second = deferred<CardResponse>();
  vi.mocked(cardsApi.getCard)
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(cardsApi.getActiveCards).toHaveBeenCalled());
  await act(async () => {
    void result.current.selectCard(1);
  });
  await act(async () => {
    void result.current.selectCard(2);
  });
  await waitFor(() => expect(cardsApi.getCard).toHaveBeenCalledTimes(2));
  await act(async () => {
    second.resolve(card(2));
    await second.promise;
  });
  await act(async () => {
    first.resolve(card(1));
    await first.promise;
  });
  expect(result.current.selectedCard?.id).toBe(2);
});

it("uses the archived list item for an archived preview without loading detail", async () => {
  const archivedCard = { ...card(3), status: "ARCHIVED" as const };
  vi.mocked(cardsApi.getArchivedCards).mockResolvedValue({ ...page(3, 0), content: [archivedCard] });
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(cardsApi.getActiveCards).toHaveBeenCalled());
  act(() => result.current.changeTab("ARCHIVED"));
  await waitFor(() => expect(result.current.archivedStatus).toBe("success"));

  await act(async () => {
    await result.current.selectCard(3);
  });

  expect(cardsApi.getCard).not.toHaveBeenCalled();
  expect(result.current.selectedCard).toMatchObject({ id: 3, front: "front 3", status: "ARCHIVED" });
  expect(result.current.selectedCardStatus).toBe("success");
});

it.each(["create", "update", "archive", "restore"] as const)(
  "keeps existing state and exposes a retryable %s mutation error",
  async (type) => {
    const failure = new Error("failed");
    vi.mocked(cardsApi.createCard).mockRejectedValue(failure);
    vi.mocked(cardsApi.updateCard).mockRejectedValue(failure);
    vi.mocked(cardsApi.archiveCard).mockRejectedValue(failure);
    vi.mocked(cardsApi.restoreCard).mockRejectedValue(failure);
    const { result } = renderHook(() => useCards(1));
    await waitFor(() => expect(result.current.activeStatus).toBe("success"));
    await act(async () => {
      await result.current.selectCard(1);
    });
    const invoke = {
      create: () => result.current.createCard({ front: "new", back: "card" }),
      update: () => result.current.updateCard(1, { front: "changed" }),
      archive: () => result.current.archiveCard(1),
      restore: () => result.current.restoreCard(1),
    }[type];

    await act(async () => {
      await expect(invoke()).rejects.toMatchObject({ code: "HTTP_ERROR" });
    });

    expect(result.current.active.content[0]?.id).toBe(1);
    expect(result.current.selectedCard?.id).toBe(1);
    expect(result.current.mutationStatus).toBe("error");
    expect(result.current.mutationType).toBe(type);
    await act(async () => {
      await expect(invoke()).rejects.toMatchObject({ code: "HTTP_ERROR" });
    });
  },
);

it("allows only one in-flight create request", async () => {
  const pending = deferred<CardResponse>();
  vi.mocked(cardsApi.createCard).mockReturnValue(pending.promise);
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(result.current.activeStatus).toBe("success"));

  let first!: Promise<CardResponse>;
  await act(async () => {
    first = result.current.createCard({ front: "new", back: "card" });
  });
  await expect(result.current.createCard({ front: "new", back: "card" })).rejects.toMatchObject({
    code: "MUTATION_IN_PROGRESS",
  });
  expect(cardsApi.createCard).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve(card(2));
    await first;
  });
});

it("allows only one in-flight archive request", async () => {
  const pending = deferred<void>();
  vi.mocked(cardsApi.archiveCard).mockReturnValue(pending.promise);
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(result.current.activeStatus).toBe("success"));

  let first!: Promise<void>;
  await act(async () => {
    first = result.current.archiveCard(1);
  });
  await expect(result.current.archiveCard(1)).rejects.toMatchObject({ code: "MUTATION_IN_PROGRESS" });
  expect(cardsApi.archiveCard).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve();
    await first;
  });
});

it("moves to the previous page after archiving the last item", async () => {
  vi.mocked(cardsApi.getActiveCards).mockImplementation((_deckId, number) =>
    Promise.resolve(page(number === 1 ? 2 : 1, number)),
  );
  vi.mocked(cardsApi.archiveCard).mockResolvedValue();
  const { result } = renderHook(() => useCards(1));
  await waitFor(() => expect(result.current.activeStatus).toBe("success"));
  act(() => result.current.changePage(1));
  await waitFor(() => expect(result.current.active.number).toBe(1));

  await act(async () => {
    await result.current.archiveCard(2);
  });

  expect(result.current.active.number).toBe(0);
  await waitFor(() => expect(cardsApi.getActiveCards).toHaveBeenLastCalledWith(1, 0, 50, expect.any(AbortSignal)));
});
