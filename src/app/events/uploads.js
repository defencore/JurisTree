import { $ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { processFiles } from "../../features/attachments.js";

export function bindUploadsEvents() {
  document.addEventListener("dragover", (e) => {
    if (e.target.closest("#dropZone,#canvasWrap")) {
      e.preventDefault();
      $("#dropZone")?.classList.add("drag-over");
    }
  });
  document.addEventListener("dragleave", (e) => {
    if (e.target.closest("#dropZone"))
      $("#dropZone")?.classList.remove("drag-over");
  });
  document.addEventListener("drop", (e) => {
    if (e.target.closest("#dropZone,#canvasWrap")) {
      e.preventDefault();
      $("#dropZone")?.classList.remove("drag-over");
      processFiles(
        [...e.dataTransfer.files],
        appState.selected?.kind === "person"
          ? {
              personId: appState.selected.id,
            }
          : {},
      );
    }
  });
}
