import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDeck } from "../../api/decksApi";
import { ApiError } from "../../api/apiError";
import { DeckDetailsPanel } from "../../components/decks/DeckDetailsPanel";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/layout/PageHeader";
import type { DeckResponse } from "../../types/deck";
import { formatApiError } from "../../utils/formatApiError";
import { createStudySession, getActiveStudySession } from "../../api/studySessionsApi";
import { useToast } from "../../components/ui/Toast/useToast";

export function DeckDetailsPage() {
  const { deckId } = useParams();
  const id = Number(deckId);
  const [deck, setDeck] = useState<DeckResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyLoading, setStudyLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const load = async () => {
    if (!Number.isSafeInteger(id)) {
      setError(new ApiError("DECK_NOT_FOUND", "", 404));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDeck(await getDeck(id));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason : new ApiError("HTTP_ERROR", "", 0));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    queueMicrotask(() => void load());
    // load is intentionally recreated from the current route id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);
  const startStudy = async () => {
    if (!deck || studyLoading) return;
    setStudyLoading(true);
    try {
      const active = await getActiveStudySession(deck.id);
      const session = active ?? (await createStudySession(deck.id));
      navigate(`/study-sessions/${session.id}`);
    } catch (reason) {
      const apiError = reason instanceof ApiError ? reason : new ApiError("HTTP_ERROR", "", 0);
      if (apiError.code === "STUDY_SESSION_ALREADY_ACTIVE") {
        try {
          const session = await getActiveStudySession(deck.id);
          if (session) {
            navigate(`/study-sessions/${session.id}`);
            return;
          }
        } catch {
          /* Surface original error below. */
        }
      }
      showToast(
        apiError.code === "NO_CARDS_AVAILABLE"
          ? "Для этой колоды сейчас нет карточек для занятия"
          : formatApiError(apiError),
        "error",
      );
    } finally {
      setStudyLoading(false);
    }
  };
  return (
    <main className="page">
      <PageHeader
        title="Колода"
        action={
          <Link to="/decks">
            <Button variant="secondary">К списку колод</Button>
          </Link>
        }
      />
      {loading && <Skeleton height="360px" />}
      {error && <ErrorState message={formatApiError(error)} onRetry={() => void load()} />}
      {deck && (
        <DeckDetailsPanel
          deck={deck}
          onEdit={() => undefined}
          onArchive={() => undefined}
          onRestore={() => undefined}
          onStudy={() => void startStudy()}
          studyLoading={studyLoading}
        />
      )}
    </main>
  );
}
