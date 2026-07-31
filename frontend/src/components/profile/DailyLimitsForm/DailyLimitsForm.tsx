import { Input } from "../../ui/Input";
import styles from "./DailyLimitsForm.module.css";

type Limits = {
  dailyNewCardsLimit: number;
  dailyReviewLimit: number;
};

type Props = {
  limits: Limits;
  onChange: (limits: Limits) => void;
  errors?: { dailyNewCardsLimit?: string; dailyReviewLimit?: string };
};

export function DailyLimitsForm({ limits, onChange, errors }: Props) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Дневные лимиты</legend>
      <div className={styles.grid}>
        <Input
          label="Новых карточек в день"
          type="number"
          min={0}
          max={1000}
          value={limits.dailyNewCardsLimit}
          helperText="Минимум: 0, максимум: 1000"
          error={errors?.dailyNewCardsLimit}
          onChange={(e) => onChange({ ...limits, dailyNewCardsLimit: Number(e.target.value) })}
        />
        <Input
          label="Повторений в день"
          type="number"
          min={1}
          max={10000}
          value={limits.dailyReviewLimit}
          helperText="Минимум: 1, максимум: 10000"
          error={errors?.dailyReviewLimit}
          onChange={(e) => onChange({ ...limits, dailyReviewLimit: Number(e.target.value) })}
        />
      </div>
      {limits.dailyNewCardsLimit === 0 && (
        <p className={styles.hint} role="status">
          Новые карточки не будут добавляться в изучение
        </p>
      )}
    </fieldset>
  );
}
