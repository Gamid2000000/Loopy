import { apiClient } from "./apiClient";
import type {
  CardImportPreviewRequest,
  CardImportPreviewResponse,
  CardImportRequest,
  CardImportResultResponse,
} from "../types/cardImport";

export function previewImport(
  deckId: number,
  request: CardImportPreviewRequest,
  signal?: AbortSignal,
) {
  return apiClient<CardImportPreviewResponse>(
    `/cards/decks/${deckId}/import/preview`,
    { method: "POST", body: JSON.stringify(request), signal },
  );
}

export function commitImport(deckId: number, request: CardImportRequest) {
  return apiClient<CardImportResultResponse>(
    `/cards/decks/${deckId}/import`,
    { method: "POST", body: JSON.stringify(request) },
  );
}
