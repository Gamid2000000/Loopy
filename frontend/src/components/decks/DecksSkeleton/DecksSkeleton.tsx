import { Skeleton } from "../../ui/Skeleton";
export function DecksSkeleton() {
  return (
    <div aria-label="Загрузка колод">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} height="78px" />
      ))}
    </div>
  );
}
