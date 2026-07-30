import type { ReviewGrade } from "../../../types/review";
import { ReviewGradeButton } from "../ReviewGradeButton";
import styles from "./ReviewControls.module.css";
const grades: ReviewGrade[] = ["AGAIN", "HARD", "GOOD", "EASY"];
export function ReviewControls({ onGrade, disabled }: { onGrade: (grade: ReviewGrade) => void; disabled: boolean }) { return <div className={styles.controls} aria-label="Оценка ответа">{grades.map((grade) => <ReviewGradeButton key={grade} grade={grade} disabled={disabled} onClick={() => onGrade(grade)} />)}</div>; }
