export type CardStatus = "ACTIVE" | "ARCHIVED";
export type CardSort = "UPDATED_DESC" | "CREATED_DESC" | "CREATED_ASC" | "FRONT_ASC" | "FRONT_DESC";

export interface CardListQuery {
  query?: string;
  sort: CardSort;
  page: number;
  size: number;
}

export interface BulkCardActionResponse {
  requestedCount: number;
  changedCount: number;
  unchangedCount: number;
  changedCardIds: number[];
  unchangedCardIds: number[];
}

export interface CardSummaryResponse {
  id: number;
  front: string;
  back: string;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CardResponse extends CardSummaryResponse {
  deckId: number;
  example: string | null;
  note: string | null;
}

export interface CreateCardRequest {
  front: string;
  back: string;
  example?: string | null;
  note?: string | null;
}

/** Omitted properties are unchanged; example/note: null clears the value. */
export interface UpdateCardRequest {
  front?: string;
  back?: string;
  example?: string | null;
  note?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
