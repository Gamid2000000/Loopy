import { Button } from "../Button";
import { Card } from "../Card";
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card role="alert">
      <h2>Не удалось загрузить данные</h2>
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Повторить</Button>}
    </Card>
  );
}
