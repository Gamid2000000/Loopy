import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/apiError";
import * as sessionsApi from "../api/studySessionsApi";
import { submitReview as sendReview } from "../api/reviewsApi";
import type { CurrentStudyCardResponse, StudySessionResponse } from "../types/studySession";
import type { ReviewGrade, SubmitReviewRequest } from "../types/review";

type LoadStatus = "idle" | "loading" | "success" | "error";
const aborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
const asError = (error: unknown) => (error instanceof ApiError ? error : new ApiError("HTTP_ERROR", "", 0));
const uuid = () => crypto.randomUUID();

export function useStudySession(sessionId: number | null) {
  const [session, setSession] = useState<StudySessionResponse | null>(null);
  const [currentCard, setCurrentCard] = useState<CurrentStudyCardResponse | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [isAnswerRevealed, setRevealed] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<LoadStatus>("idle");
  const [reviewError, setReviewError] = useState<ApiError | null>(null);
  const [cancelStatus, setCancelStatus] = useState<LoadStatus>("idle");
  const [cancelError, setCancelError] = useState<ApiError | null>(null);
  const [pendingReview, setPendingReview] = useState<SubmitReviewRequest | null>(null);
  const startedViewingAt = useRef<number | null>(null);
  const controller = useRef<AbortController | null>(null);
  const reviewInFlight = useRef(false);
  const cancelInFlight = useRef(false);
  const loadSession = useCallback(async () => {
    controller.current?.abort();
    if (sessionId === null || !Number.isSafeInteger(sessionId) || sessionId < 1) {
      setError(new ApiError("STUDY_SESSION_NOT_FOUND", "", 404));
      setStatus("error");
      return;
    }
    const current = new AbortController();
    controller.current = current;
    setStatus("loading");
    setError(null);
    setCurrentCard(null);
    setRevealed(false);
    try {
      const next = await sessionsApi.getStudySession(sessionId, current.signal);
      if (controller.current !== current) return;
      setSession(next);
      if (next.status === "ACTIVE") {
        const card = await sessionsApi.getCurrentStudyCard(sessionId, current.signal);
        if (controller.current !== current) return;
        setCurrentCard(card);
        startedViewingAt.current = performance.now();
      }
      setStatus("success");
    } catch (reason) {
      if (!aborted(reason) && controller.current === current) {
        setError(asError(reason));
        setStatus("error");
      }
    }
  }, [sessionId]);
  useEffect(() => {
    queueMicrotask(() => void loadSession());
    return () => controller.current?.abort();
  }, [loadSession]);
  const revealAnswer = useCallback(() => setRevealed(true), []);
  const submit = useCallback(
    async (request: SubmitReviewRequest) => {
      if (sessionId === null || reviewStatus === "loading" || reviewInFlight.current) return;
      reviewInFlight.current = true;
      setReviewStatus("loading");
      setReviewError(null);
      setPendingReview(request);
      try {
        const response = await sendReview(sessionId, request);
        setPendingReview(null);
        setReviewStatus("success");
        setRevealed(false);
        const refreshed = {
          ...session!,
          status: response.session.status,
          currentPosition: response.session.currentPosition,
          remainingCardsCount: response.session.remainingCardsCount,
          totalCardsCount: response.session.totalCardsCount,
        };
        setSession(refreshed);
        if (response.session.status === "COMPLETED") {
          setCurrentCard(null);
          return;
        }
        const next = response.nextCard ?? (await sessionsApi.getCurrentStudyCard(sessionId));
        setCurrentCard(next);
        startedViewingAt.current = performance.now();
      } catch (reason) {
        if (!aborted(reason)) {
          setReviewError(asError(reason));
          setReviewStatus("error");
        }
      } finally {
        reviewInFlight.current = false;
      }
    },
    [reviewStatus, session, sessionId],
  );
  const submitGrade = useCallback(
    (grade: ReviewGrade) => {
      if (!currentCard || pendingReview || reviewStatus === "loading") return;
      const elapsed = Math.max(0, Math.round(performance.now() - (startedViewingAt.current ?? performance.now())));
      void submit({
        sessionCardId: currentCard.sessionCardId,
        grade,
        responseTimeMs: Math.min(elapsed, 86_400_000),
        clientReviewId: uuid(),
      });
    },
    [currentCard, pendingReview, reviewStatus, submit],
  );
  const retryReview = useCallback(() => {
    if (pendingReview) void submit(pendingReview);
  }, [pendingReview, submit]);
  const cancelSession = useCallback(async () => {
    if (sessionId === null || reviewStatus === "loading" || cancelStatus === "loading" || cancelInFlight.current)
      return false;
    cancelInFlight.current = true;
    setCancelStatus("loading");
    setCancelError(null);
    try {
      await sessionsApi.cancelStudySession(sessionId);
      setSession((value) => (value ? { ...value, status: "CANCELLED" } : value));
      setCurrentCard(null);
      setCancelStatus("success");
      return true;
    } catch (reason) {
      if (!aborted(reason)) {
        setCancelError(asError(reason));
        setCancelStatus("error");
      }
      return false;
    } finally {
      cancelInFlight.current = false;
    }
  }, [cancelStatus, reviewStatus, sessionId]);
  return {
    session,
    currentCard,
    status,
    error,
    isAnswerRevealed,
    reviewStatus,
    reviewError,
    cancelStatus,
    cancelError,
    pendingReview,
    loadSession,
    reload: loadSession,
    revealAnswer,
    submitGrade,
    retryReview,
    cancelSession,
  };
}
