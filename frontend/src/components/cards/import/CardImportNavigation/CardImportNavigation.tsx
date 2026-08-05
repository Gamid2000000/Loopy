import { Button } from "../../../ui/Button";
import { ArrowLeftIcon, ArrowRightIcon } from "../../../icons/ImportIcons";
import type { ImportStep } from "../../../../types/cardImport";
import styles from "./CardImportNavigation.module.css";

interface Props {
  step: ImportStep;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function CardImportNavigation({
  step,
  onNext,
  onBack,
  nextLabel = "Далее",
  nextDisabled = false,
  nextLoading = false,
}: Props) {
  if (step === "result") return null;
  return (
    <div className={styles.navigation}>
      {onBack ? (
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeftIcon size={16} />}>
          Назад
        </Button>
      ) : (
        <span />
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          loading={nextLoading}
          rightIcon={<ArrowRightIcon size={16} />}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
