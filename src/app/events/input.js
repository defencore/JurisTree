import { renderPeople } from "../../ui/render.js";
import { renderEvents } from "../../features/events.js";
import { renderDocuments } from "../../features/documents.js";
import { state as appState } from "../../core/state.js";
import { $, $$ } from "../../core/dom.js";
import { getLocale } from "../../i18n/index.js";
export function bindInputEvents() {
  document.addEventListener("input", (e) => {
    if (e.target.id === "networkSeedSearch") {
      const q = e.target.value.toLocaleLowerCase(getLocale());
      $$("[data-seed-name]").forEach(
        (label) => (label.hidden = !label.dataset.seedName.includes(q)),
      );
    }
    if (e.target.id === "peopleSearch") renderPeople();
    if (e.target.id === "eventSearch") {
      const start = e.target.selectionStart;
      appState.eventSearch = e.target.value;
      appState.eventLimit = 80;
      renderEvents();
      $("#eventSearch").focus();
      $("#eventSearch").setSelectionRange(start, start);
    }
    if (e.target.id === "docSearch") {
      const start = e.target.selectionStart;
      appState.docFilter = e.target.value;
      renderDocuments();
      $("#docSearch").focus();
      $("#docSearch").setSelectionRange(start, start);
    }
  });
}
