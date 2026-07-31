import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "../../app/paths";
import { ErrorState } from "../../components/ui/ErrorState";
import { useCards } from "../../hooks/useCards";
import { useCardImport } from "../../hooks/useCardImport";
import { formatApiError } from "../../utils/formatApiError";
import { CardImportDropzone } from "../../components/cards/import/CardImportDropzone";
import { CardImportFileSummary } from "../../components/cards/import/CardImportFileSummary";
import { CardImportSettings } from "../../components/cards/import/CardImportSettings";
import { CardImportColumnMapping } from "../../components/cards/import/CardImportColumnMapping";
import { CardImportPreviewSummary } from "../../components/cards/import/CardImportPreviewSummary";
import { CardImportPreviewTable } from "../../components/cards/import/CardImportPreviewTable";
import { CardImportResult } from "../../components/cards/import/CardImportResult";
import { CardImportStepper } from "../../components/cards/import/CardImportStepper";
import { CardImportNavigation } from "../../components/cards/import/CardImportNavigation";
import { Spinner } from "../../components/ui/Spinner";

export function CardImportPage() {
  const { deckId } = useParams();
  const id = Number(deckId);
  const validId = Number.isSafeInteger(id) && id > 0 ? id : null;
  const cards = useCards(validId);

  const importCtx = useCardImport(validId ?? 0);

  useEffect(() => {
    if (importCtx.step !== "result") return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [importCtx.step]);

  useEffect(() => {
    if (
      importCtx.step !== "file" &&
      importCtx.step !== "result"
    ) {
      const onBefore = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", onBefore);
      return () => window.removeEventListener("beforeunload", onBefore);
    }
  }, [importCtx.step]);

  if (validId === null) {
    return (
      <main className="page">
        <ErrorState message="Неверный идентификатор колоды" />
        <Link to={paths.decks}>Вернуться к колодам</Link>
      </main>
    );
  }

  if (cards.deckStatus !== "success") {
    return (
      <main className="page">
        {cards.deckStatus === "error" ? (
          <ErrorState message={formatApiError(cards.deckError)} onRetry={() => void cards.loadDeck()} />
        ) : (
          <Spinner label="Загрузка" />
        )}
      </main>
    );
  }

  if (!cards.deck) return null;

  if (cards.deck.status === "ARCHIVED") {
    return (
      <main className="page">
        <ErrorState message="Колода в архиве. Импорт недоступен." />
        <Link to={paths.decks}>Вернуться к колодам</Link>
      </main>
    );
  }

  const fileStep = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      <CardImportDropzone
        onFile={(f) => {
          importCtx.setFile(f);
          void importCtx.parse(f);
        }}
      />
      <CardImportFileSummary
        result={importCtx.parseResult}
        error={importCtx.parseError}
      />
      {importCtx.parseResult && !importCtx.parseError && (
        <CardImportSettings
          delimiter={importCtx.delimiter}
          setDelimiter={importCtx.setDelimiter}
          hasHeader={importCtx.hasHeader}
          setHasHeader={importCtx.setHasHeader}
        />
      )}
    </div>
  );

  const mappingStep = (
    <CardImportColumnMapping
      headers={importCtx.parseResult?.rows[0] ?? []}
      mapping={importCtx.columnMapping}
      onChange={importCtx.setColumnMapping}
      previewRows={
        importCtx.parseResult
          ? (importCtx.hasHeader
              ? importCtx.parseResult.rows.slice(1, 6)
              : importCtx.parseResult.rows.slice(0, 5))
          : []
      }
    />
  );

  const previewStep = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      {importCtx.previewStatus === "loading" && (
        <div style={{ textAlign: "center", padding: "var(--spacing-8)" }}>
          <Spinner label="Проверка строк" />
          <p style={{ color: "var(--color-text-muted)", marginTop: "var(--spacing-2)" }}>
            Проверяем строки...
          </p>
        </div>
      )}
      {importCtx.previewStatus === "error" && (
        <ErrorState
          message={importCtx.previewError ?? "Не удалось проверить строки"}
          onRetry={() => void importCtx.requestPreview()}
        />
      )}
      {importCtx.previewStatus === "success" && importCtx.preview && (
        <>
          <CardImportPreviewSummary preview={importCtx.preview} />
          <CardImportPreviewTable
            preview={importCtx.preview}
            selected={importCtx.selectedRowNumbers}
            onToggle={importCtx.toggleRow}
            onSelectAll={importCtx.selectAllValid}
            onClear={importCtx.clearSelection}
          />
        </>
      )}
    </div>
  );

  const resultStep = importCtx.result ? (
    <CardImportResult
      result={importCtx.result}
      deckId={validId}
      onReset={importCtx.resetImport}
    />
  ) : null;

  const stepContent = {
    file: fileStep,
    mapping: mappingStep,
    preview: previewStep,
    result: resultStep,
  };

  return (
    <main className="page">
      <div style={{ marginBottom: "var(--spacing-2)" }}>
        <Link
          to={`/decks/${validId}/cards`}
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          &larr; Назад к карточкам
        </Link>
      </div>
      <h1>Импорт карточек</h1>
      <p style={{ color: "var(--color-text-secondary)", margin: "0 0 24px" }}>
        Колода: {cards.deck.name}
      </p>
      <CardImportStepper current={importCtx.step} />
      <div style={{ maxWidth: 900 }}>
        {stepContent[importCtx.step]}
        <CardImportNavigation
          step={importCtx.step}
          onBack={
            importCtx.step === "mapping"
              ? () => importCtx.setStep("file")
              : importCtx.step === "preview"
                ? () => importCtx.setStep("mapping")
                : importCtx.step === "result"
                  ? undefined
                  : undefined
          }
          onNext={
            importCtx.step === "file"
              ? () => importCtx.setStep("mapping")
              : importCtx.step === "mapping"
                ? () => {
                    importCtx.setStep("preview");
                    void importCtx.requestPreview();
                  }
                : importCtx.step === "preview"
                  ? () => void importCtx.commitImport()
                  : undefined
          }
          nextLabel={
            importCtx.step === "mapping"
              ? "Проверить"
              : importCtx.step === "preview"
                ? "Импортировать"
                : "Далее"
          }
          nextDisabled={
            importCtx.step === "file"
              ? !importCtx.parseResult || !!importCtx.parseError
              : importCtx.step === "mapping"
                ? !importCtx.isMappingValid || !!importCtx.isSameColumn
                : importCtx.step === "preview"
                  ? importCtx.selectedRowNumbers.size === 0 ||
                    importCtx.importStatus === "loading"
                  : false
          }
          nextLoading={
            importCtx.step === "mapping"
              ? importCtx.previewStatus === "loading"
              : importCtx.step === "preview"
                ? importCtx.importStatus === "loading"
                : false
          }
        />
        {importCtx.importError && (
          <p
            role="alert"
            style={{
              color: "var(--color-danger)",
              marginTop: "var(--spacing-2)",
            }}
          >
            {importCtx.importError}
          </p>
        )}
      </div>
    </main>
  );
}
