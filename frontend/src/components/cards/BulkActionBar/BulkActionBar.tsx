import { Button } from "../../ui/Button";

export function BulkActionBar({ count, archived, onAction, onClear }: { count: number; archived: boolean; onAction: () => void; onClear: () => void }) {
  return <div role="status">Выбрано: {count} <Button variant="danger" onClick={onAction}>{archived ? "Восстановить" : "Архивировать"}</Button> <Button variant="secondary" onClick={onClear}>Снять выбор</Button></div>;
}
