import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/apiError";
export type ForumLoadStatus = "idle" | "loading" | "success" | "error" | "refreshing";
const aborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
export function useForumResource<T>(key: string, request: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null); const [status, setStatus] = useState<ForumLoadStatus>("idle"); const [error, setError] = useState<ApiError | null>(null); const sequence = useRef(0); const controller = useRef<AbortController | null>(null); const requestRef = useRef(request); const dataRef = useRef(data);
  useEffect(() => { requestRef.current = request; dataRef.current = data; });
  const run = useCallback(async () => { if (!enabled) return; controller.current?.abort(); const current = ++sequence.current; const nextController = new AbortController(); controller.current = nextController; setStatus(dataRef.current ? "refreshing" : "loading"); setError(null); try { const value = await requestRef.current(nextController.signal); if (current === sequence.current) { setData(value); setStatus("success"); } } catch (reason) { if (current === sequence.current && !aborted(reason)) { setError(reason instanceof ApiError ? reason : new ApiError("HTTP_ERROR", "", 0)); setStatus("error"); } } }, [enabled]);
  useEffect(() => { if (!enabled) return; void run(); return () => controller.current?.abort(); }, [key, enabled, run]);
  return { data, status, error, retry: run };
}
