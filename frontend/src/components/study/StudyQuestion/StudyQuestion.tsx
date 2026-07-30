import styles from "./StudyQuestion.module.css";
export function StudyQuestion({ front }: { front: string }) { return <div className={styles.question}><p>Вопрос</p><h1 id="study-card-title">{front}</h1></div>; }
