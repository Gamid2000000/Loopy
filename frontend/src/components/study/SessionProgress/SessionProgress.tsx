import { ProgressBar } from "../../ui/ProgressBar";
export function SessionProgress({ completed, total }: { completed: number; total: number }) { const safeTotal = Math.max(0, total); const safeCompleted = Math.min(safeTotal, Math.max(0, completed)); return <ProgressBar value={safeCompleted} max={safeTotal} label={`Карточка ${safeTotal === 0 ? 0 : safeCompleted + 1} из ${safeTotal}`} />; }
