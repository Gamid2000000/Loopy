import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/apiError";
import * as cardsApi from "../api/cardsApi";
import { getDeck } from "../api/decksApi";
import type { DeckResponse } from "../types/deck";
import type {
  CardResponse,
  CardSort,
  CardStatus,
  CardSummaryResponse,
  CreateCardRequest,
  PageResponse,
  UpdateCardRequest,
} from "../types/card";

export type LoadStatus = "idle" | "loading" | "success" | "error";
export type CardMutationType = "create" | "update" | "archive" | "restore";
export type BulkMutationType = "bulkArchive" | "bulkRestore";

const aborted = (value: unknown) => value instanceof DOMException && value.name === "AbortError";
const errorOf = (value: unknown) => (value instanceof ApiError ? value : new ApiError("HTTP_ERROR", "", 0));
const emptyPage = (size: number): PageResponse<CardSummaryResponse> => ({
  content: [],
  number: 0,
  size,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  empty: true,
});

export function useCards(deckId: number | null) {
  const [deck, setDeck] = useState<DeckResponse | null>(null);
  const [deckStatus, setDeckStatus] = useState<LoadStatus>("idle");
  const [deckError, setDeckError] = useState<ApiError | null>(null);
  const [tab, setTab] = useState<CardStatus>("ACTIVE");
  const [pageSize, setPageSize] = useState(50);
  const [query, setQueryValue] = useState("");
  const [sort, setSortValue] = useState<CardSort>("UPDATED_DESC");
  const [activePage, setActivePage] = useState(0);
  const [archivedPage, setArchivedPage] = useState(0);
  const [active, setActive] = useState<PageResponse<CardSummaryResponse>>(emptyPage(50));
  const [archived, setArchived] = useState<PageResponse<CardSummaryResponse>>(emptyPage(50));
  const [activeStatus, setActiveStatus] = useState<LoadStatus>("idle");
  const [archivedStatus, setArchivedStatus] = useState<LoadStatus>("idle");
  const [activeError, setActiveError] = useState<ApiError | null>(null);
  const [archivedError, setArchivedError] = useState<ApiError | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | CardSummaryResponse | null>(null);
  const [selectedCardStatus, setSelectedCardStatus] = useState<LoadStatus>("idle");
  const [selectedCardError, setSelectedCardError] = useState<ApiError | null>(null);
  const [mutationType, setMutationType] = useState<CardMutationType | null>(null);
  const [mutationStatus, setMutationStatus] = useState<LoadStatus>("idle");
  const [mutationError, setMutationError] = useState<ApiError | null>(null);
  const listController = useRef<AbortController | null>(null);
  const listRequestId = useRef(0);
  const deckController = useRef<AbortController | null>(null);
  const detailController = useRef<AbortController | null>(null);
  const detailRequestId = useRef(0);
  const inFlight = useRef<Set<CardMutationType>>(new Set());

  const loadDeck = useCallback(async () => {
    if (deckId === null) {
      setDeckError(new ApiError("DECK_NOT_FOUND", "", 404));
      setDeckStatus("error");
      return;
    }
    deckController.current?.abort();
    const controller = new AbortController();
    deckController.current = controller;
    setDeckStatus("loading");
    setDeckError(null);
    try {
      setDeck(await getDeck(deckId, controller.signal));
      setDeckStatus("success");
    } catch (error) {
      if (!aborted(error)) {
        setDeckError(errorOf(error));
        setDeckStatus("error");
      }
    }
  }, [deckId]);
  const load = useCallback(
    async (status: CardStatus, page: number) => {
      if (deckId === null || deck?.status === "ARCHIVED") return;
      listController.current?.abort();
      const controller = new AbortController();
      listController.current = controller;
      const requestId = ++listRequestId.current;
      const setStatus = status === "ACTIVE" ? setActiveStatus : setArchivedStatus;
      const setError = status === "ACTIVE" ? setActiveError : setArchivedError;
      setStatus("loading");
      setError(null);
      try {
        const data = await (status === "ACTIVE"
          ? cardsApi.getActiveCards(deckId, { query, sort, page, size: pageSize }, controller.signal)
          : cardsApi.getArchivedCards(deckId, { query, sort, page, size: pageSize }, controller.signal));
        if (requestId !== listRequestId.current) return;
        (status === "ACTIVE" ? setActive : setArchived)(data);
        setStatus("success");
      } catch (error) {
        if (!aborted(error) && requestId === listRequestId.current) {
          setError(errorOf(error));
          setStatus("error");
        }
      }
    },
    [deck?.status, deckId, pageSize, query, sort],
  );
  const selectCard = useCallback(
    async (cardId: number) => {
      setSelectedCardId(cardId);
      detailController.current?.abort();
      const requestId = ++detailRequestId.current;
      setSelectedCardError(null);
      if (tab === "ARCHIVED") {
        const card = archived.content.find((item) => item.id === cardId) ?? null;
        setSelectedCard(card);
        setSelectedCardStatus(card ? "success" : "idle");
        return;
      }
      const controller = new AbortController();
      detailController.current = controller;
      setSelectedCard(null);
      setSelectedCardStatus("loading");
      try {
        const card = await cardsApi.getCard(cardId, controller.signal);
        if (requestId !== detailRequestId.current) return;
        setSelectedCard(card);
        setSelectedCardStatus("success");
      } catch (error) {
        if (!aborted(error) && requestId === detailRequestId.current) {
          setSelectedCardError(errorOf(error));
          setSelectedCardStatus("error");
        }
      }
    },
    [archived.content, tab],
  );
  const mutate = useCallback(async <T>(type: CardMutationType, action: () => Promise<T>) => {
    if (inFlight.current.has(type)) throw new ApiError("MUTATION_IN_PROGRESS", "", 0);
    inFlight.current.add(type);
    setMutationType(type);
    setMutationStatus("loading");
    setMutationError(null);
    try {
      const result = await action();
      setMutationStatus("success");
      return result;
    } catch (error) {
      const apiError = errorOf(error);
      setMutationStatus("error");
      setMutationError(apiError);
      throw apiError;
    } finally {
      inFlight.current.delete(type);
    }
  }, []);
  const removeFromPage = useCallback(
    async (id: number, status: CardStatus) => {
      const page = status === "ACTIVE" ? active : archived;
      const pageNumber = status === "ACTIVE" ? activePage : archivedPage;
      const nextTotal = Math.max(0, page.totalElements - 1);
      const nextPages = Math.ceil(nextTotal / page.size);
      const nextPage = page.content.length === 1 && pageNumber > 0 ? pageNumber - 1 : pageNumber;
      (status === "ACTIVE" ? setActive : setArchived)((value) => ({
        ...value,
        content: value.content.filter((card) => card.id !== id),
        totalElements: Math.max(0, value.totalElements - 1),
        totalPages: Math.ceil(Math.max(0, value.totalElements - 1) / value.size),
        empty: Math.max(0, value.totalElements - 1) === 0,
        number: nextPage,
        first: nextPage === 0,
        last: nextPage >= Math.max(0, nextPages - 1),
      }));
      if (status === "ACTIVE") setActivePage(nextPage);
      else setArchivedPage(nextPage);
      if (selectedCardId === id) {
        detailController.current?.abort();
        setSelectedCard(null);
        setSelectedCardId(null);
        setSelectedCardStatus("idle");
      }
      if (nextPage !== pageNumber) await load(status, nextPage);
    },
    [active, activePage, archived, archivedPage, load, selectedCardId],
  );
  const createCard = useCallback(
    (request: CreateCardRequest) =>
      mutate("create", async () => {
        if (deckId === null) throw new ApiError("DECK_NOT_FOUND", "", 404);
        const card = await cardsApi.createCard(deckId, request);
        setTab("ACTIVE");
        setActivePage(0);
        await load("ACTIVE", 0);
        setSelectedCard(card);
        setSelectedCardId(card.id);
        setSelectedCardStatus("success");
        return card;
      }),
    [deckId, load, mutate],
  );
  const updateCard = useCallback(
    (id: number, request: UpdateCardRequest) =>
      mutate("update", async () => {
        const card = await cardsApi.updateCard(id, request);
        const replace = (page: PageResponse<CardSummaryResponse>) => ({
          ...page,
          content: page.content.map((item) => (item.id === id ? card : item)),
        });
        setActive(replace);
        setArchived(replace);
        setSelectedCard(card);
        setSelectedCardId(card.id);
        setSelectedCardStatus("success");
        return card;
      }),
    [mutate],
  );
  const archiveCard = useCallback(
    (id: number) =>
      mutate("archive", async () => {
        await cardsApi.archiveCard(id);
        await removeFromPage(id, "ACTIVE");
        setArchivedStatus("idle");
      }),
    [mutate, removeFromPage],
  );
  const restoreCard = useCallback(
    (id: number) =>
      mutate("restore", async () => {
        const card = await cardsApi.restoreCard(id);
        await removeFromPage(id, "ARCHIVED");
        setActiveStatus("idle");
        return card;
      }),
    [mutate, removeFromPage],
  );
  const bulkArchive = useCallback(
    (cardIds: number[]) =>
      mutate("archive", async () => {
        if (deckId === null) throw new ApiError("DECK_NOT_FOUND", "", 404);
        await cardsApi.bulkArchiveCards(deckId, cardIds);
        setSelectedCard(null);
        setSelectedCardId(null);
        await load("ACTIVE", activePage);
        setArchivedStatus("idle");
      }),
    [activePage, deckId, load, mutate],
  );
  const bulkRestore = useCallback(
    (cardIds: number[]) =>
      mutate("restore", async () => {
        if (deckId === null) throw new ApiError("DECK_NOT_FOUND", "", 404);
        await cardsApi.bulkRestoreCards(deckId, cardIds);
        setSelectedCard(null);
        setSelectedCardId(null);
        await load("ARCHIVED", archivedPage);
        setActiveStatus("idle");
      }),
    [archivedPage, deckId, load, mutate],
  );
  const setQuery = useCallback((value: string) => {
    setQueryValue(value);
    setActivePage(0);
    setArchivedPage(0);
  }, []);
  const setSort = useCallback((value: CardSort) => {
    setSortValue(value);
    setActivePage(0);
    setArchivedPage(0);
  }, []);
  const loadActive = useCallback(() => load("ACTIVE", activePage), [activePage, load]);
  const loadArchived = useCallback(() => load("ARCHIVED", archivedPage), [archivedPage, load]);
  const changeTab = useCallback(
    (value: CardStatus) => {
      setTab(value);
      setSelectedCard(null);
      setSelectedCardId(null);
      void load(value, value === "ACTIVE" ? activePage : archivedPage);
    },
    [activePage, archivedPage, load],
  );
  const changePage = useCallback(
    (next: number) => {
      const current = tab === "ACTIVE" ? active : archived;
      const lastPage = Math.max(0, current.totalPages - 1);
      const page = Math.min(lastPage, Math.max(0, next));
      if (tab === "ACTIVE") setActivePage(page);
      else setArchivedPage(page);
      void load(tab, page);
    },
    [active, archived, load, tab],
  );
  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setActivePage(0);
    setArchivedPage(0);
  }, []);
  const reloadCurrentTab = useCallback(async () => {
    await loadDeck();
    await load(tab, tab === "ACTIVE" ? activePage : archivedPage);
    if (selectedCardId) void selectCard(selectedCardId);
  }, [activePage, archivedPage, load, loadDeck, selectCard, selectedCardId, tab]);
  useEffect(() => {
    queueMicrotask(() => void loadDeck());
  }, [loadDeck]);
  useEffect(() => {
    if (deckStatus === "success" && deck?.status === "ACTIVE") queueMicrotask(() => void loadActive());
  }, [deck?.status, deckStatus, loadActive]);
  useEffect(
    () => () => {
      listController.current?.abort();
      deckController.current?.abort();
      detailController.current?.abort();
    },
    [],
  );
  return {
    deck,
    deckStatus,
    deckError,
    tab,
    active,
    archived,
    activeStatus,
    archivedStatus,
    activeError,
    archivedError,
    selectedCardId,
    selectedCard,
    selectedCardStatus,
    selectedCardError,
    mutationType,
    mutationStatus,
    mutationError,
    query,
    sort,
    pageSize,
    loadDeck,
    loadActive,
    loadArchived,
    reloadCurrentTab,
    selectCard,
    changeTab,
    changePage,
    changePageSize,
    createCard,
    updateCard,
    archiveCard,
    restoreCard,
    bulkArchive,
    bulkRestore,
    setQuery,
    setSort,
  };
}
