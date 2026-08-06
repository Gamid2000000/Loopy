import { Button } from "../../ui/Button";
import type { PageResponse } from "../../../types/forum";
import styles from "./ForumPagination.module.css";
export function ForumPagination({ page, data, onChange }: { page: number; data: PageResponse<unknown>; onChange(page: number): void }) {
  if (data.totalPages <= 1) return null;
  return <nav className={styles.pagination} aria-label="Пагинация"><Button variant="secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>Назад</Button><span aria-current="page">Страница {page + 1} из {data.totalPages}</span><Button variant="secondary" disabled={page >= data.totalPages - 1} onClick={() => onChange(page + 1)}>Вперёд</Button></nav>;
}
