import { apiClient } from "./apiClient";
import type { CreateDeckRequest, DeckResponse, DeckSummaryResponse, UpdateDeckRequest } from "../types/deck";

export function getActiveDecks(signal?: AbortSignal): Promise<DeckSummaryResponse[]> {
  return apiClient<DeckSummaryResponse[]>("/decks", { signal });
}
export function getArchivedDecks(signal?: AbortSignal): Promise<DeckSummaryResponse[]> {
  return apiClient<DeckSummaryResponse[]>("/decks/archived", { signal });
}
export function getDeck(deckId: number, signal?: AbortSignal): Promise<DeckResponse> {
  return apiClient<DeckResponse>(`/decks/${deckId}`, { signal });
}
export function createDeck(request: CreateDeckRequest): Promise<DeckResponse> {
  return apiClient<DeckResponse>("/decks", { method: "POST", body: JSON.stringify(request) });
}
export function updateDeck(deckId: number, request: UpdateDeckRequest): Promise<DeckResponse> {
  return apiClient<DeckResponse>(`/decks/${deckId}`, { method: "PATCH", body: JSON.stringify(request) });
}
export function archiveDeck(deckId: number): Promise<void> {
  return apiClient<void>(`/decks/${deckId}`, { method: "DELETE" });
}
export function restoreDeck(deckId: number): Promise<DeckResponse> {
  return apiClient<DeckResponse>(`/decks/${deckId}/restore`, { method: "POST" });
}
