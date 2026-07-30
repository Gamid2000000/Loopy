import { Card } from "../../ui/Card";
import { ProgressBar } from "../../ui/ProgressBar";
import type { StudyAvailability } from "../../../types/dashboard";
export function DailyLimitProgress({ availability }: { availability: StudyAvailability }) {
  return (
    <Card>
      <h2>Дневные лимиты</h2>
      <ProgressBar label="Повторы" value={availability.reviewCardsQueuedToday} max={availability.dailyReviewLimit} />
      <ProgressBar label="Новые" value={availability.newCardsQueuedToday} max={availability.dailyNewCardsLimit} />
    </Card>
  );
}
