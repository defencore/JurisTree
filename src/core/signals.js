const listeners = new Map();

/** Connect application effects without making data services depend on the UI. */
export function onSignal(name, listener) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(listener);
  return () => listeners.get(name)?.delete(listener);
}

export function emitSignal(name, value) {
  for (const listener of listeners.get(name) || []) listener(value);
}
