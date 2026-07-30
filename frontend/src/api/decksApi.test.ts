import {
  archiveDeck,
  createDeck,
  getActiveDecks,
  getArchivedDecks,
  getDeck,
  restoreDeck,
  updateDeck,
} from "./decksApi";

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))));
afterEach(() => vi.unstubAllGlobals());

it("uses all deck endpoints and request methods", async () => {
  await getActiveDecks();
  await getArchivedDecks();
  await getDeck(4);
  await createDeck({ name: "Русский" });
  await updateDeck(4, { description: null });
  await restoreDeck(4);
  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/decks", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/decks/archived", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/decks/4", expect.any(Object));
  expect(fetch).toHaveBeenNthCalledWith(
    4,
    "http://localhost:8080/api/decks",
    expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Русский" }) }),
  );
  expect(fetch).toHaveBeenNthCalledWith(
    5,
    "http://localhost:8080/api/decks/4",
    expect.objectContaining({ method: "PATCH", body: JSON.stringify({ description: null }) }),
  );
  expect(fetch).toHaveBeenNthCalledWith(
    6,
    "http://localhost:8080/api/decks/4/restore",
    expect.objectContaining({ method: "POST" }),
  );
});

it("accepts the no-content archive response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  await expect(archiveDeck(4)).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8080/api/decks/4",
    expect.objectContaining({ method: "DELETE" }),
  );
});
