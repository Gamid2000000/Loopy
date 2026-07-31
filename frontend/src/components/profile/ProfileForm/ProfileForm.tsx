import { Card } from "../../ui/Card";
import { DailyLimitsForm } from "../DailyLimitsForm";
import { LanguageSelect } from "../LanguageSelect";
import { TimezoneSelect } from "../TimezoneSelect";
import styles from "./ProfileForm.module.css";
import type { UserProfileResponse } from "../../../types/user";

type Props = {
  draft: UserProfileResponse;
  fieldErrors: Record<string, string>;
  onDraftChange: (updater: (prev: UserProfileResponse) => UserProfileResponse) => void;
};

export function ProfileForm({ draft, fieldErrors, onDraftChange }: Props) {
  return (
    <div className={styles.form}>
      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Языки</h2>
        <div className={styles.languageGrid}>
          <LanguageSelect
            label="Родной язык"
            value={draft.nativeLanguage}
            nullable
            otherValue={draft.learningLanguage}
            onChange={(value) => onDraftChange((prev) => ({ ...prev, nativeLanguage: value }))}
            error={fieldErrors.nativeLanguage}
          />
          <LanguageSelect
            label="Изучаемый язык"
            value={draft.learningLanguage}
            nullable
            otherValue={draft.nativeLanguage}
            onChange={(value) => onDraftChange((prev) => ({ ...prev, learningLanguage: value }))}
            error={fieldErrors.learningLanguage}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <TimezoneSelect
          value={draft.timezone}
          error={fieldErrors.timezone}
          onChange={(value) => onDraftChange((prev) => ({ ...prev, timezone: value }))}
        />
      </Card>

      <Card className={styles.section}>
        <DailyLimitsForm
          limits={{
            dailyNewCardsLimit: draft.dailyNewCardsLimit,
            dailyReviewLimit: draft.dailyReviewLimit,
          }}
          errors={{
            dailyNewCardsLimit: fieldErrors.dailyNewCardsLimit,
            dailyReviewLimit: fieldErrors.dailyReviewLimit,
          }}
          onChange={(limits) => onDraftChange((prev) => ({ ...prev, ...limits }))}
        />
      </Card>
    </div>
  );
}
