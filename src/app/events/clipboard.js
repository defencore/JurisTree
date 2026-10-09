import { $ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { editDocument } from "../../features/documents.js";
import { pastedImages } from "../../services/clipboard.js";

export function selectedSourceContext() {
  const selected = appState.selected;
  return selected?.kind === "person"
    ? { personId: selected.id }
    : selected?.kind === "relation"
      ? { relationId: selected.id }
      : {};
}

export function bindClipboardEvents() {
  document.addEventListener("paste", (event) => {
    if (
      !appState.editorActive ||
      $("#cropDialog").open ||
      event.defaultPrevented
    )
      return;
    const modal = $("#modal"),
      files = pastedImages(event);
    if (!files.length) return;
    if (modal.open) {
      if (modal.dataset.kind !== "source-view") return;
      event.preventDefault();
      editDocument(modal.dataset.sourceId, files);
    } else if (
      !event.target.closest('input,textarea,[contenteditable="true"]')
    ) {
      event.preventDefault();
      editDocument(null, files, selectedSourceContext());
    }
  });
}
