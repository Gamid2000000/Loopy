import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStudySession } from "../../hooks/useStudySession";
import { StudySkeleton } from "../../components/study/StudySkeleton";
import { StudyErrorState } from "../../components/study/StudyErrorState";
import { StudyHeader } from "../../components/study/StudyHeader";
import { StudyCard } from "../../components/study/StudyCard";
import { StudyQuestion } from "../../components/study/StudyQuestion";
import { StudyAnswer } from "../../components/study/StudyAnswer";
import { RevealAnswerButton } from "../../components/study/RevealAnswerButton";
import { ReviewControls } from "../../components/study/ReviewControls";
import { CancelSessionDialog } from "../../components/study/CancelSessionDialog";
import { SessionResult } from "../../components/study/SessionResult";
import { Button } from "../../components/ui/Button";
import { formatApiError } from "../../utils/formatApiError";
import styles from "./StudySessionPage.module.css";

const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.matches("input, textarea, select, button") || target.isContentEditable);
export function StudySessionPage() {
  const { sessionId } = useParams();
  const id = sessionId && /^\d+$/.test(sessionId) ? Number(sessionId) : null;
  const study = useStudySession(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (editable(event.target) || cancelOpen || study.reviewStatus === "loading") return;
      if (!study.isAnswerRevealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        study.revealAnswer();
        return;
      }
      if (study.isAnswerRevealed) {
        const grade = ({ "1": "AGAIN", "2": "HARD", "3": "GOOD", "4": "EASY" } as const)[event.key];
        if (grade) {
          event.preventDefault();
          study.submitGrade(grade);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cancelOpen, study]);
  if (study.status === "loading" || study.status === "idle") return <StudySkeleton />;
  if (study.status === "error")
    return (
      <StudyErrorState
        message={study.error ? formatApiError(study.error) : "Не удалось загрузить сессию"}
        onRetry={() => void study.reload()}
      />
    );
  if (!study.session) return null;
  if (study.session.status === "COMPLETED") return <SessionResult session={study.session} />;
  if (study.session.status === "CANCELLED")
    return (
      <main className="page">
        <h1>Эта учебная сессия была отменена</h1>
        <Link to="/dashboard">
          <Button>На главную</Button>
        </Link>{" "}
        <Link to={`/decks/${study.session.deckId}`}>
          <Button variant="secondary">К колоде</Button>
        </Link>
      </main>
    );
  if (!study.currentCard)
    return <StudyErrorState message="Не удалось получить текущую карточку" onRetry={() => void study.reload()} />;
  const completed = study.session.totalCardsCount - study.session.remainingCardsCount;
  return (
    <div className={styles.session}>
      <StudyHeader
        deckName={study.session.deckName}
        position={study.currentCard.position}
        total={study.session.totalCardsCount}
        onCancel={() => setCancelOpen(true)}
        disabled={study.reviewStatus === "loading" || study.cancelStatus === "loading"}
      />
      <main className={styles.main}>
        <p className={styles.progress}>
          Выполнено {Math.max(0, completed)} из {study.session.totalCardsCount}
        </p>
        <StudyCard revealed={study.isAnswerRevealed}>
          <StudyQuestion front={study.currentCard.front} />
          {study.isAnswerRevealed ? (
            <>
              <StudyAnswer
                back={study.currentCard.back}
                example={study.currentCard.example}
                note={study.currentCard.note}
              />
              <ReviewControls
                onGrade={study.submitGrade}
                disabled={study.reviewStatus === "loading" || Boolean(study.pendingReview)}
              />
            </>
          ) : (
            <RevealAnswerButton onClick={study.revealAnswer} />
          )}
          {study.reviewError && (
            <div role="alert">
              <p>{formatApiError(study.reviewError)}</p>
              {study.pendingReview && <Button onClick={study.retryReview}>Повторить отправку</Button>}
            </div>
          )}
        </StudyCard>
      </main>
      {cancelOpen && (
        <CancelSessionDialog
          busy={study.cancelStatus === "loading"}
          onClose={() => setCancelOpen(false)}
          onConfirm={() =>
            void study.cancelSession().then((cancelled) => {
              if (cancelled) setCancelOpen(false);
            })
          }
        />
      )}
      {study.cancelError && <p role="alert">{formatApiError(study.cancelError)}</p>}
    </div>
  );
}
