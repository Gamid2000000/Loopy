import { Button } from "../../ui/Button";
import styles from "./ProfileSaveBar.module.css";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileSaveBar({ isDirty, isSaving, saveStatus, onSave, onCancel }: Props) {
  return (
    <div className={styles.bar}>
      <Button type="button" variant="primary" onClick={onSave} loading={isSaving} disabled={!isDirty || isSaving}>
        Сохранить изменения
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={!isDirty || isSaving}>
        Отменить изменения
      </Button>
      {saveStatus === "saved" && (
        <span className={styles.saved} role="status">
          Сохранено
        </span>
      )}
    </div>
  );
}
