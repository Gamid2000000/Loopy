import { Select } from "../../ui/Select";
import type { CardSort } from "../../../types/card";

export function CardSortSelect({ value, onChange }: { value: CardSort; onChange: (value: CardSort) => void }) {
  return <Select label="Сортировка" value={value} onChange={(event) => onChange(event.target.value as CardSort)}><option value="UPDATED_DESC">Недавно изменённые</option><option value="CREATED_DESC">Сначала новые</option><option value="CREATED_ASC">Сначала старые</option><option value="FRONT_ASC">По алфавиту А–Я</option><option value="FRONT_DESC">По алфавиту Я–А</option></Select>;
}
