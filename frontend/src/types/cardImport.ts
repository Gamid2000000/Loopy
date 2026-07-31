export type CardImportRowStatus = "VALID" | "INVALID" | "DUPLICATE_IN_FILE" | "DUPLICATE_IN_DECK";

export interface CardImportRowRequest {
  rowNumber: number;
  front: string;
  back: string;
  example?: string | null;
  note?: string | null;
}

export interface CardImportPreviewRequest {
  rows: CardImportRowRequest[];
}

export interface CardImportRequest {
  rows: CardImportRowRequest[];
}

export interface CardImportPreviewRowResponse {
  rowNumber: number;
  front: string | null;
  back: string | null;
  example: string | null;
  note: string | null;
  status: CardImportRowStatus;
  errors: string[];
}

export interface CardImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateInFileRows: number;
  duplicateInDeckRows: number;
  rows: CardImportPreviewRowResponse[];
}

export interface ImportedCardResponse {
  rowNumber: number;
  cardId: number;
  front: string;
  back: string;
}

export interface CardImportResultResponse {
  requestedRows: number;
  importedRows: number;
  skippedDuplicateRows: number;
  cards: ImportedCardResponse[];
}

export interface ParsedImportFile {
  headers: string[];
  rows: string[][];
  delimiter: "," | "\t";
  totalRows: number;
  fileName: string;
  fileSize: number;
}

export type ImportColumn = "front" | "back" | "example" | "note" | null;

export interface ColumnMapping {
  front: number | null;
  back: number | null;
  example: number | null;
  note: number | null;
}

export type ImportStep = "file" | "mapping" | "preview" | "result";

export type DelimiterMode = "auto" | "comma" | "tab";
