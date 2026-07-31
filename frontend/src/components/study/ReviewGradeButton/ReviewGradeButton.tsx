import { Button } from "../../ui/Button";
import type { ReviewGrade } from "../../../types/review";
const labels: Record<ReviewGrade, string> = { AGAIN: "Снова", HARD: "Трудно", GOOD: "Хорошо", EASY: "Легко" };
export function ReviewGradeButton({
  grade,
  onClick,
  disabled,
}: {
  grade: ReviewGrade;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant={grade === "AGAIN" ? "danger" : grade === "HARD" ? "secondary" : "primary"}
      onClick={onClick}
      disabled={disabled}
    >
      {labels[grade]} <kbd>{{ AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 }[grade]}</kbd>
    </Button>
  );
}
