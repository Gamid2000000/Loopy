import { Link } from "react-router-dom";
import { Button } from "../../../ui/Button";
import type { CardImportResultResponse } from "../../../../types/cardImport";
import { CheckIcon } from "../../../icons/ImportIcons";

interface Props {
  result: CardImportResultResponse;
  deckId: number;
  onReset: () => void;
}

export function CardImportResult({ result, deckId, onReset }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--spacing-6)",
        padding: "var(--spacing-8)",
        textAlign: "center",
      }}
    >
      <CheckIcon size={64} />
      <div>
        <h2 style={{ margin: 0 }}>Импорт завершён</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
          Импортировано: {result.importedRows}
          {result.skippedDuplicateRows > 0 && (
            <> · Пропущено дубликатов: {result.skippedDuplicateRows}</>
          )}
        </p>
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to={`/decks/${deckId}/cards`}>
          <Button leftIcon={<CheckIcon size={16} />}>Открыть карточки</Button>
        </Link>
        <Button variant="secondary" onClick={onReset}>
          Импортировать ещё файл
        </Button>
      </div>
    </div>
  );
}
