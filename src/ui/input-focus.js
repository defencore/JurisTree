/** Preserve text selection and horizontal scrolling when a workspace replaces its search field. */
export function renderWithInputFocus(input, render) {
  const focused = document.activeElement === input;
  const { id, selectionStart, selectionEnd, selectionDirection, scrollLeft } =
    input;
  render();
  const replacement = focused && document.getElementById(id);
  if (!replacement) return;
  replacement.focus({ preventScroll: true });
  if (selectionStart != null)
    replacement.setSelectionRange(
      selectionStart,
      selectionEnd,
      selectionDirection,
    );
  replacement.scrollLeft = scrollLeft;
}
