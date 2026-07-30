import { Button } from "../../ui/Button";
import styles from "./RevealAnswerButton.module.css";
export function RevealAnswerButton({ onClick }: { onClick: () => void }) { return <Button className={styles.button} onClick={onClick}>Показать ответ <kbd>Space</kbd></Button>; }
