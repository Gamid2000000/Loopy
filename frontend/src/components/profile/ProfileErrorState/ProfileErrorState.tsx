import { ErrorState } from "../../ui/ErrorState";

type Props = {
  onRetry: () => void;
};

export function ProfileErrorState({ onRetry }: Props) {
  return <ErrorState message="Не удалось загрузить профиль" onRetry={onRetry} />;
}
