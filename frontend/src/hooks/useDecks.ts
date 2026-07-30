import { useCallback, useEffect, useRef, useState } from "react";
import * as decksApi from "../api/decksApi";
import { ApiError } from "../api/apiError";
import type {
  CreateDeckRequest,
  DeckResponse,
  DeckStatus,
  DeckSummaryResponse,
  UpdateDeckRequest,
} from "../types/deck";

export type LoadStatus = "idle" | "loading" | "success" | "error";
const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
const asApiError = (error: unknown) => (error instanceof ApiError ? error : new ApiError("HTTP_ERROR", "", 0));
const replace = (items: DeckSummaryResponse[], deck: DeckResponse) =>
  items.map((item) => (item.id === deck.id ? deck : item));

export function useDecks(initialStatus: DeckStatus = "ACTIVE") {
  const [activeDecks, setActiveDecks] = useState<DeckSummaryResponse[]>([]);
  const [archivedDecks, setArchivedDecks] = useState<DeckSummaryResponse[]>([]);
  const [activeStatus, setActiveStatus] = useState<LoadStatus>("idle");
  const [archivedStatus, setArchivedStatus] = useState<LoadStatus>("idle");
  const [activeError, setActiveError] = useState<ApiError | null>(null);
  const [archivedError, setArchivedError] = useState<ApiError | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<DeckResponse | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [selectedDeckStatus, setSelectedDeckStatus] = useState<LoadStatus>("idle");
  const [selectedDeckError, setSelectedDeckError] = useState<ApiError | null>(null);
  const [mutationStatus, setMutationStatus] = useState<LoadStatus>("idle");
  const [tab, setTab] = useState<DeckStatus>(initialStatus);
  const listControllers = useRef<Record<DeckStatus, AbortController | null>>({ ACTIVE: null, ARCHIVED: null });
  const detailController = useRef<AbortController | null>(null);

  const load = useCallback(
    async (status: DeckStatus, force = false) => {
      const loaded = status === "ACTIVE" ? activeStatus === "success" : archivedStatus === "success";
      if (!force && loaded) return;
      if (listControllers.current[status]) return;
      const controller = new AbortController();
      listControllers.current[status] = controller;
      const setStatus = status === "ACTIVE" ? setActiveStatus : setArchivedStatus;
      const setError = status === "ACTIVE" ? setActiveError : setArchivedError;
      setStatus("loading");
      setError(null);
      try {
        const data = await (status === "ACTIVE"
          ? decksApi.getActiveDecks(controller.signal)
          : decksApi.getArchivedDecks(controller.signal));
        (status === "ACTIVE" ? setActiveDecks : setArchivedDecks)(data);
        setStatus("success");
      } catch (error) {
        if (!isAbort(error)) {
          setError(asApiError(error));
          setStatus("error");
        }
      } finally {
        if (listControllers.current[status] === controller) listControllers.current[status] = null;
      }
    },
    [activeStatus, archivedStatus],
  );
  const loadActive = useCallback((force = false) => load("ACTIVE", force), [load]);
  const loadArchived = useCallback((force = false) => load("ARCHIVED", force), [load]);
  const selectDeck = useCallback(
    async (deckId: number, status: DeckStatus = tab) => {
      setSelectedDeckId(deckId);
      if (status === "ARCHIVED") {
        const deck = archivedDecks.find((item) => item.id === deckId);
        if (deck) {
          setSelectedDeck(deck);
          setSelectedDeckStatus("success");
          setSelectedDeckError(null);
        }
        return;
      }
      detailController.current?.abort();
      const controller = new AbortController();
      detailController.current = controller;
      setSelectedDeck(null);
      setSelectedDeckStatus("loading");
      setSelectedDeckError(null);
      try {
        setSelectedDeck(await decksApi.getDeck(deckId, controller.signal));
        setSelectedDeckStatus("success");
      } catch (error) {
        if (!isAbort(error)) {
          setSelectedDeckError(asApiError(error));
          setSelectedDeckStatus("error");
        }
      } finally {
        if (detailController.current === controller) detailController.current = null;
      }
    },
    [archivedDecks, tab],
  );
  const runMutation = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setMutationStatus("loading");
    try {
      const result = await action();
      setMutationStatus("success");
      return result;
    } catch (error) {
      setMutationStatus("error");
      throw error;
    }
  }, []);
  const create = useCallback(
    (request: CreateDeckRequest) =>
      runMutation(async () => {
        const deck = await decksApi.createDeck(request);
        setActiveDecks((items) => [deck, ...items]);
        setActiveStatus("success");
        setSelectedDeck(deck);
        setSelectedDeckStatus("success");
        setTab("ACTIVE");
        return deck;
      }),
    [runMutation],
  );
  const update = useCallback(
    (deckId: number, request: UpdateDeckRequest) =>
      runMutation(async () => {
        const deck = await decksApi.updateDeck(deckId, request);
        setActiveDecks((items) => replace(items, deck));
        setSelectedDeck(deck);
        setSelectedDeckStatus("success");
        return deck;
      }),
    [runMutation],
  );
  const archive = useCallback(
    (deckId: number) =>
      runMutation(async () => {
        await decksApi.archiveDeck(deckId);
        setActiveDecks((items) => items.filter((item) => item.id !== deckId));
        setArchivedStatus("idle");
        setSelectedDeck(null);
        setSelectedDeckStatus("idle");
      }),
    [runMutation],
  );
  const restore = useCallback(
    (deckId: number) =>
      runMutation(async () => {
        const deck = await decksApi.restoreDeck(deckId);
        setArchivedDecks((items) => items.filter((item) => item.id !== deckId));
        setActiveStatus("idle");
        setSelectedDeck(deck);
        setSelectedDeckStatus("success");
        return deck;
      }),
    [runMutation],
  );
  const changeTab = useCallback(
    (status: DeckStatus) => {
      setTab(status);
      setSelectedDeck(null);
      setSelectedDeckId(null);
      setSelectedDeckStatus("idle");
      void load(status);
    },
    [load],
  );
  const reloadCurrentTab = useCallback(() => load(tab, true), [load, tab]);
  useEffect(() => {
    queueMicrotask(() => void load("ACTIVE"));
    const controllers = listControllers.current;
    return () => {
      controllers.ACTIVE?.abort();
      controllers.ARCHIVED?.abort();
      detailController.current?.abort();
    };
    // The initial request must not be restarted merely because its loading state changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    activeDecks,
    archivedDecks,
    activeStatus,
    archivedStatus,
    activeError,
    archivedError,
    selectedDeck,
    selectedDeckId,
    selectedDeckStatus,
    selectedDeckError,
    mutationStatus,
    tab,
    loadActive,
    loadArchived,
    reloadCurrentTab,
    selectDeck,
    createDeck: create,
    updateDeck: update,
    archiveDeck: archive,
    restoreDeck: restore,
    changeTab,
  };
}
