import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import type { PageResponse } from "../../../types/card";
import styles from "./CardsPagination.module.css";
export function CardsPagination({
  page,
  onPage,
  onSize,
}: {
  page: PageResponse<unknown>;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}) {
  if (page.totalPages < 1) return null;
  return (
    <nav className={styles.nav} aria-label="Навигация по страницам">
      <Button
        variant="secondary"
        aria-label="Предыдущая страница"
        disabled={page.first}
        onClick={() => onPage(page.number - 1)}
      >
        Назад
      </Button>
      <span>
        Страница {page.number + 1} из {page.totalPages} · {page.totalElements}
      </span>
      <Button
        variant="secondary"
        aria-label="Следующая страница"
        disabled={page.last}
        onClick={() => onPage(page.number + 1)}
      >
        Вперёд
      </Button>
      <Select label="Карточек на странице" value={page.size} onChange={(e) => onSize(Number(e.target.value))}>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </Select>
    </nav>
  );
}
