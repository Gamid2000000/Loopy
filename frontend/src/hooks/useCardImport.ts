import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/apiError";
import * as cardImportApi from "../api/cardImportApi";
import type {
  CardImportPreviewResponse,
  CardImportResultResponse,
  CardImportRowRequest,
  ColumnMapping,
  DelimiterMode,
  ImportStep,
  ParsedImportFile,
} from "../types/cardImport";
import { parseCardImportFile, ParseError, autoMapColumns } from "../utils/parseCardImportFile";

export type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCardImport(deckId: number) {
  const [step, setStep] = useState<ImportStep>("file");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParsedImportFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<DelimiterMode>("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    front: null,
    back: null,
    example: null,
    note: null,
  });
  const [mappedRows, setMappedRows] = useState<CardImportRowRequest[]>([]);
  const [preview, setPreview] = useState<CardImportPreviewResponse | null>(null);
  const [previewStatus, setPreviewStatus] = useState<LoadStatus>("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(new Set());
  const [importStatus, setImportStatus] = useState<LoadStatus>("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<CardImportResultResponse | null>(null);
  const previewAbort = useRef<AbortController | null>(null);
  const commitInFlight = useRef(false);

  const parse = useCallback(async (f: File) => {
    setParseError(null);
    setParseResult(null);
    try {
      const result = await parseCardImportFile(f, delimiter);
      setParseResult(result);
      if (hasHeader && result.rows.length > 0) {
        setColumnMapping(autoMapColumns(result.rows[0]));
      } else {
        setColumnMapping({ front: null, back: null, example: null, note: null });
      }
    } catch (error) {
      if (error instanceof ParseError) {
        setParseError(error.message);
      } else {
        setParseError("Не удалось разобрать файл");
      }
    }
  }, [delimiter, hasHeader]);
  const importDone = useCallback(
    (response: CardImportResultResponse) => {
      setResult(response);
      setImportStatus("success");
      commitInFlight.current = false;
      setStep("result");
    },
    [],
  );
  const buildMappedRows = useCallback(() => {
    if (!parseResult) return;
    const dataRows = hasHeader && parseResult.rows.length > 1
      ? parseResult.rows.slice(1)
      : parseResult.rows;
    const rows: CardImportRowRequest[] = dataRows
      .map((row, idx) => ({
        rowNumber: idx + 1,
        front: columnMapping.front !== null ? (row[columnMapping.front] ?? "") : "",
        back: columnMapping.back !== null ? (row[columnMapping.back] ?? "") : "",
        example: columnMapping.example !== null ? (row[columnMapping.example] ?? null) : null,
        note: columnMapping.note !== null ? (row[columnMapping.note] ?? null) : null,
      }))
      .filter((row) => row.front.trim() || row.back.trim() || row.example?.trim() || row.note?.trim());
    setMappedRows(rows);
  }, [parseResult, hasHeader, columnMapping]);
  const requestPreview = useCallback(async () => {
    previewAbort.current?.abort();
    buildMappedRows();
    const controller = new AbortController();
    previewAbort.current = controller;
    setPreviewStatus("loading");
    setPreviewError(null);
    try {
      const rows = mappedRows.length > 0 ? mappedRows : (() => {
        const dataRows = hasHeader && parseResult?.rows && parseResult.rows.length > 1
          ? parseResult.rows.slice(1)
          : (parseResult?.rows ?? []);
        return dataRows
          .map((row, idx) => ({
            rowNumber: idx + 1,
            front: columnMapping.front !== null ? (row[columnMapping.front] ?? "") : "",
            back: columnMapping.back !== null ? (row[columnMapping.back] ?? "") : "",
            example: columnMapping.example !== null ? (row[columnMapping.example] ?? null) : null,
            note: columnMapping.note !== null ? (row[columnMapping.note] ?? null) : null,
          }))
          .filter((row) => row.front.trim() || row.back.trim() || row.example?.trim() || row.note?.trim());
      })();
      const response = await cardImportApi.previewImport(
        deckId,
        { rows },
        controller.signal,
      );
      setPreview(response);
      const valid = new Set<number>();
      for (const row of response.rows) {
        if (row.status === "VALID") valid.add(row.rowNumber);
      }
      setSelectedRowNumbers(valid);
      setPreviewStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const msg =
        error instanceof ApiError
          ? error.code === "NETWORK_ERROR"
            ? error.message
            : error.message
          : "Не удалось проверить строки";
      setPreviewError(msg);
      setPreviewStatus("error");
    }
  }, [deckId, mappedRows, buildMappedRows, parseResult, hasHeader, columnMapping]);
  const toggleRow = useCallback(
    (rowNumber: number) => {
      if (!preview) return;
      const row = preview.rows.find((r) => r.rowNumber === rowNumber);
      if (!row || (row.status !== "VALID" && !selectedRowNumbers.has(rowNumber))) return;
      setSelectedRowNumbers((prev) => {
        const next = new Set(prev);
        if (next.has(rowNumber)) next.delete(rowNumber);
        else next.add(rowNumber);
        return next;
      });
    },
    [preview, selectedRowNumbers],
  );
  const selectAllValid = useCallback(() => {
    if (!preview) return;
    const valid = new Set<number>(
      preview.rows.filter((r) => r.status === "VALID").map((r) => r.rowNumber),
    );
    setSelectedRowNumbers(valid);
  }, [preview]);
  const clearSelection = useCallback(() => {
    setSelectedRowNumbers(new Set());
  }, []);
  const commitImport = useCallback(async () => {
    if (commitInFlight.current || !preview) return;
    commitInFlight.current = true;
    setImportStatus("loading");
    setImportError(null);
    try {
      const selectedRows = preview.rows
        .filter((r) => selectedRowNumbers.has(r.rowNumber))
        .map((r) => ({
          rowNumber: r.rowNumber,
          front: r.front ?? "",
          back: r.back ?? "",
          example: r.example,
          note: r.note,
        }));
      const response = await cardImportApi.commitImport(deckId, { rows: selectedRows });
      importDone(response);
    } catch (error) {
      commitInFlight.current = false;
      if (error instanceof ApiError) {
        if (error.isNetworkError) {
          setImportError(
            "Не удалось подтвердить результат импорта. Обновите список карточек перед повторной попыткой.",
          );
        } else {
          setImportError(error.message);
        }
      } else {
        setImportError("Не удалось выполнить импорт");
      }
      setImportStatus("error");
    }
  }, [deckId, preview, selectedRowNumbers, importDone]);
  const resetImport = useCallback(() => {
    previewAbort.current?.abort();
    setStep("file");
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setDelimiter("auto");
    setHasHeader(true);
    setColumnMapping({ front: null, back: null, example: null, note: null });
    setMappedRows([]);
    setPreview(null);
    setPreviewStatus("idle");
    setPreviewError(null);
    setSelectedRowNumbers(new Set());
    setImportStatus("idle");
    setImportError(null);
    setResult(null);
    commitInFlight.current = false;
  }, []);
  const isMappingValid =
    columnMapping.front !== null && columnMapping.back !== null;
  const isSameColumn =
    columnMapping.front !== null &&
    (columnMapping.front === columnMapping.back ||
      columnMapping.front === columnMapping.example ||
      columnMapping.front === columnMapping.note ||
      (columnMapping.back !== null && columnMapping.back === columnMapping.example) ||
      (columnMapping.back !== null && columnMapping.back === columnMapping.note) ||
      (columnMapping.example !== null && columnMapping.example === columnMapping.note));

  useEffect(() => {
    return () => {
      previewAbort.current?.abort();
    };
  }, []);

  return {
    step,
    setStep,
    file,
    setFile,
    parse,
    parseResult,
    parseError,
    delimiter,
    setDelimiter,
    hasHeader,
    setHasHeader,
    columnMapping,
    setColumnMapping,
    mappedRows,
    preview,
    previewStatus,
    previewError,
    selectedRowNumbers,
    importStatus,
    importError,
    result,
    requestPreview,
    toggleRow,
    selectAllValid,
    clearSelection,
    commitImport,
    resetImport,
    isMappingValid,
    isSameColumn,
  };
}
