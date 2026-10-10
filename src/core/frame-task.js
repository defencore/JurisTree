/** Coalesce preview updates while allowing release and cancellation to finish synchronously. */
export function frameTask(update) {
  let frame = null;
  function cancel() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  return {
    request() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        update();
      });
    },
    cancel,
  };
}
