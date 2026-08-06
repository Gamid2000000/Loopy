import { renderHook, act, waitFor } from "@testing-library/react";
import { ApiError } from "../api/apiError";
import { useForumResource } from "./useForumResource";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

it("aborts previous request when resource key changes", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  const requests: AbortSignal[] = [];
  const request = vi.fn((signal: AbortSignal) => {
    requests.push(signal);
    return requests.length === 1 ? first.promise : second.promise;
  });
  const { rerender } = renderHook(({ key }: { key: string }) => useForumResource(key, request), { initialProps: { key: "a" } });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender({ key: "b" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(requests[0].aborted).toBe(true);
  act(() => { second.resolve("b-result"); });
  await waitFor(() => expect(requests[1].aborted).toBe(false));
});

it("does not surface AbortError as UI error", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  let callCount = 0;
  const request = vi.fn((signal: AbortSignal) => {
    callCount++;
    if (callCount === 1) return first.promise;
    signal.addEventListener("abort", () => {
      second.reject(new DOMException("Aborted", "AbortError"));
    });
    return second.promise;
  });
  const { rerender, result } = renderHook(({ key }: { key: string }) => useForumResource(key, request), { initialProps: { key: "a" } });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender({ key: "b" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  act(() => { first.resolve("stale"); });
  await waitFor(() => {
    if (result.current.status !== "loading" && result.current.status !== "refreshing") return;
  }).catch(() => {});
  expect(result.current.status).not.toBe("error");
  expect(result.current.error).toBeNull();
});

it("ignores stale success when a newer key is active", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  let call = 0;
  const request = vi.fn(() => { call++; return call === 1 ? first.promise : second.promise; });
  const { rerender, result } = renderHook(({ key }: { key: string }) => useForumResource(key, request), { initialProps: { key: "a" } });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender({ key: "b" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  act(() => { second.resolve("value-b"); });
  await waitFor(() => expect(result.current.data).toBe("value-b"));
  act(() => { first.resolve("value-a"); });
  await waitFor(() => expect(result.current.data).toBe("value-b"));
});

it("ignores stale error when a newer key is active", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  let call = 0;
  const request = vi.fn(() => { call++; return call === 1 ? first.promise : second.promise; });
  const { rerender, result } = renderHook(({ key }: { key: string }) => useForumResource(key, request), { initialProps: { key: "a" } });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender({ key: "b" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  act(() => { second.resolve("value-b"); });
  await waitFor(() => expect(result.current.data).toBe("value-b"));
  const apiError = new ApiError("SERVER_ERROR", "fail", 500);
  act(() => { first.reject(apiError); });
  await waitFor(() => expect(result.current.data).toBe("value-b"));
  expect(result.current.status).toBe("success");
});

it("aborts on unmount", () => {
  const request = vi.fn(() => new Promise(() => {}));
  const { unmount } = renderHook(() => useForumResource("a", request));
  unmount();
  const signal = (request as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AbortSignal | undefined;
  expect(signal?.aborted).toBe(true);
});

it("preserves current data during background refresh", async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  let call = 0;
  const request = vi.fn(() => { call++; return call === 1 ? first.promise : second.promise; });
  const { rerender, result } = renderHook(({ key }: { key: string }) => useForumResource(key, request), { initialProps: { key: "a" } });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  act(() => { first.resolve("value-a"); });
  await waitFor(() => expect(result.current.status).toBe("success"));
  expect(result.current.data).toBe("value-a");
  rerender({ key: "a" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(result.current.status).toBe("refreshing");
  expect(result.current.data).toBe("value-a");
  act(() => { second.resolve("value-a-v2"); });
  await waitFor(() => {
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("value-a-v2");
  });
});
