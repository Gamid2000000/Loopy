import type { ParsedImportFile } from "../../../../types/cardImport";

export function CardImportFileSummary({
  result,
  error,
}: {
  result?: ParsedImportFile | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <p role="alert" style={{ color: "var(--color-danger)", margin: 0 }}>
        {error}
      </p>
    );
  }
  if (!result) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-2)",
        padding: "var(--spacing-4)",
        background: "var(--color-surface-elevated)",
        borderRadius: "var(--radius-medium)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{result.fileName}</p>
      <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
        {(result.fileSize / 1024).toFixed(1)} КБ
        {" · "}
        {result.delimiter === "\t" ? "TSV (табуляция)" : "CSV (запятая)"}
        {" · "}
        {result.totalRows} строк{"(и)"}
      </p>
    </div>
  );
}
