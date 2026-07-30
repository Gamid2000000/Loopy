import { apiClient } from "./apiClient";
import type { CardResponse, CardSummaryResponse, CreateCardRequest, PageResponse, UpdateCardRequest } from "../types/card";

const pagePath = (path: string, page: number, size: number) => `${path}?page=${page}&size=${size}`;
export function getActiveCards(deckId: number, page: number, size: number, signal?: AbortSignal) {
  return apiClient<PageResponse<CardSummaryResponse>>(pagePath(`/cards/decks/${deckId}`, page, size), { signal });
}
export function getArchivedCards(deckId: number, page: number, size: number, signal?: AbortSignal) {
  return apiClient<PageResponse<CardSummaryResponse>>(pagePath(`/cards/decks/${deckId}/archived`, page, size), { signal });
}
export function getCard(cardId: number, signal?: AbortSignal) { return apiClient<CardResponse>(`/cards/${cardId}`, { signal }); }
export function createCard(deckId: number, request: CreateCardRequest) { return apiClient<CardResponse>(`/cards/decks/${deckId}`, { method: "POST", body: JSON.stringify(request) }); }
export function updateCard(cardId: number, request: UpdateCardRequest) { return apiClient<CardResponse>(`/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(request) }); }
export function archiveCard(cardId: number) { return apiClient<void>(`/cards/${cardId}`, { method: "DELETE" }); }
export function restoreCard(cardId: number) { return apiClient<CardResponse>(`/cards/${cardId}/restore`, { method: "POST" }); }
