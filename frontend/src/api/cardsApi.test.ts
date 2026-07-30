import { archiveCard, createCard, getActiveCards, getArchivedCards, getCard, restoreCard, updateCard } from "./cardsApi";

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))));
afterEach(() => vi.unstubAllGlobals());

it("uses card list, detail and mutation endpoints with their exact request bodies", async () => {
  await getActiveCards(7, 2, 25); await getArchivedCards(7, 1, 10); await getCard(9);
  await createCard(7, { front: "front", back: "back", example: null, note: null });
  await updateCard(9, { example: null }); await updateCard(9, { note: null }); await restoreCard(9);
  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/cards/decks/7?page=2&size=25", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/cards/decks/7/archived?page=1&size=10", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/cards/9", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(4, "http://localhost:8080/api/cards/decks/7", expect.objectContaining({ method: "POST", body: JSON.stringify({ front: "front", back: "back", example: null, note: null }) }));
  expect(fetch).toHaveBeenNthCalledWith(5, "http://localhost:8080/api/cards/9", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ example: null }) }));
  expect(fetch).toHaveBeenNthCalledWith(6, "http://localhost:8080/api/cards/9", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ note: null }) }));
  expect(fetch).toHaveBeenNthCalledWith(7, "http://localhost:8080/api/cards/9/restore", expect.objectContaining({ method: "POST" }));
});

it("accepts 204 archive and preserves AbortError", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  await expect(archiveCard(9)).resolves.toBeUndefined();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));
  await expect(getCard(9)).rejects.toMatchObject({ name: "AbortError" });
});
