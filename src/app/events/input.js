import { $, $$ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { getLocale } from "../../i18n/index.js";
import { renderPeople } from "../../ui/people.js";
import { renderSearch } from "../../ui/search.js";
import { renderCalendar } from "../../ui/workspaces/calendar.js";
import { renderDocuments } from "../../ui/workspaces/documents.js";
import { renderEvents } from "../../ui/workspaces/events.js";
import { renderProfiles } from "../../ui/workspaces/people.js";
import { renderProperty } from "../../ui/workspaces/property.js";

export function bindInputEvents() {
  document.addEventListener("input", (e) => {
    if (e.target.id === "profileSearch") {
      const start = e.target.selectionStart;
      appState.profileSearch = e.target.value;
      renderProfiles();
      $("#profileSearch").focus();
      $("#profileSearch").setSelectionRange(start, start);
      return;
    }
    if (e.target.id === "propertySearch") {
      const start = e.target.selectionStart;
      appState.propertySearch = e.target.value;
      renderProperty();
      $("#propertySearch").focus();
      $("#propertySearch").setSelectionRange(start, start);
      return;
    }
    if (e.target.id === "globalSearch") {
      appState.searchLimit = 20;
      renderSearch();
      return;
    }
    if (e.target.id === "calendarSearch") {
      const start = e.target.selectionStart;
      appState.calendarSearch = e.target.value;
      renderCalendar();
      $("#calendarSearch").focus();
      $("#calendarSearch").setSelectionRange(start, start);
    }
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
