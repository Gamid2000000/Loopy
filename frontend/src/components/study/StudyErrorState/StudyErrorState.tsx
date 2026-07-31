import { ErrorState } from "../../ui/ErrorState";
export function StudyErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="page">
      <ErrorState message={message} onRetry={onRetry} />
    </main>
  );
}
