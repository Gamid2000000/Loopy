import type { RecentStudySession } from "../../../types/dashboard";
import { formatDate } from "../../../utils/formatDate";
export function RecentSessionItem({ session, timezone }: { session: RecentStudySession; timezone?: string }) {
  return (
    <li>
      <strong>{session.deckName}</strong>
      <span>
        {session.completedCardsCount} карточек · {formatDate(session.completedAt, timezone)}
      </span>
    </li>
  );
}
