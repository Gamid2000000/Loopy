import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { ActiveStudySession } from "../../../types/dashboard";
import { formatDateTime } from "../../../utils/formatDateTime";

export function ActiveSessionCard({ session, timezone }: { session: ActiveStudySession; timezone?: string }) {
  return (
    <Card>
      <h2>Продолжить занятие</h2>
      <p>{session.deckName}</p>
      <p>
        {session.completedCardsCount} из {session.totalCardsCount} карточек
      </p>
      <p>
        {session.remainingCardsCount} осталось · {formatDateTime(session.startedAt, timezone)}
      </p>
      <Link to={`/study-sessions/${session.sessionId}`}>
        <Button fullWidth>Продолжить занятие</Button>
      </Link>
    </Card>
  );
}
