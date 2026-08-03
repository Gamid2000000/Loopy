import { Skeleton } from "../../ui/Skeleton";
import styles from "./DecksSkeleton.module.css";

/**
 * Заглушка на время загрузки списка колод. Форма повторяет новую сетку плиток
 * (DeckGrid + DeckTile) — квадратные карточки вместо старых узких строк, чтобы
 * при появлении реальных данных макет не "прыгал".
 */
export function DecksSkeleton() {
  return (
    <div className={styles.grid} aria-label="Загрузка колод">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={styles.cell}>
          <Skeleton height="100%" />
        </div>
      ))}
    </div>
  );
}
