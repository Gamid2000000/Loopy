type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeToAuthFailure(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthFailure(): void {
  listeners.forEach((listener) => listener());
}
