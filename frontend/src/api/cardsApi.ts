import { apiClient } from "./apiClient";
import type {
  BulkCardActionResponse,
  CardListQuery,
  CardResponse,
  CardSummaryResponse,
  CreateCardRequest,
  PageResponse,
  UpdateCardRequest,
} from "../types/card";

const pagePath = (path: string, listQuery: CardListQuery) => {
  const params = new URLSearchParams({ page: String(listQuery.page), size: String(listQuery.size), sort: listQuery.sort });
  const query = listQuery.query?.trim();
  if (query) params.set("query", query);
  return `${path}?${params.toString()}`;
};
export function getActiveCards(deckId: number, listQuery: CardListQuery, signal?: AbortSignal) {
  return apiClient<PageResponse<CardSummaryResponse>>(pagePath(`/cards/decks/${deckId}`, listQuery), { signal });
}
export function getArchivedCards(deckId: number, listQuery: CardListQuery, signal?: AbortSignal) {
  return apiClient<PageResponse<CardSummaryResponse>>(pagePath(`/cards/decks/${deckId}/archived`, listQuery), {
    signal,
  });
}
export function bulkArchiveCards(deckId: number, cardIds: number[]) {
  return apiClient<BulkCardActionResponse>(`/cards/decks/${deckId}/bulk/archive`, {
    method: "POST",
    body: JSON.stringify({ cardIds }),
  });
}
export function bulkRestoreCards(deckId: number, cardIds: number[]) {
  return apiClient<BulkCardActionResponse>(`/cards/decks/${deckId}/bulk/restore`, {
    method: "POST",
    body: JSON.stringify({ cardIds }),
  });
}
export function getCard(cardId: number, signal?: AbortSignal) {
  return apiClient<CardResponse>(`/cards/${cardId}`, { signal });
}
export function createCard(deckId: number, request: CreateCardRequest) {
  return apiClient<CardResponse>(`/cards/decks/${deckId}`, { method: "POST", body: JSON.stringify(request) });
}
export function updateCard(cardId: number, request: UpdateCardRequest) {
  return apiClient<CardResponse>(`/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(request) });
}
export function archiveCard(cardId: number) {
  return apiClient<void>(`/cards/${cardId}`, { method: "DELETE" });
}
export function restoreCard(cardId: number) {
  return apiClient<CardResponse>(`/cards/${cardId}/restore`, { method: "POST" });
}
