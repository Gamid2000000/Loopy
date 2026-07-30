export type DeckStatus = "ACTIVE" | "ARCHIVED";

export interface DeckSummaryResponse {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  status: DeckStatus;
  createdAt: string;
  updatedAt: string;
}

export type DeckResponse = DeckSummaryResponse;

export interface CreateDeckRequest {
  name: string;
  description?: string | null;
}

/** Omitted properties are left unchanged; description: null clears it. */
export interface UpdateDeckRequest {
  name?: string | null;
  description?: string | null;
}
