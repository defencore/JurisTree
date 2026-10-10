import { $$ } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { getLocale } from "../../i18n/index.js";
import { renderWithInputFocus } from "../../ui/input-focus.js";
import { renderPeople } from "../../ui/people.js";
import { renderSearch } from "../../ui/search.js";
import { renderCalendar } from "../../ui/workspaces/calendar.js";
import { renderImageLibrary } from "../../ui/workspaces/image-library.js";
import { renderDocuments } from "../../ui/workspaces/documents.js";
import { renderEvents } from "../../ui/workspaces/events.js";
import { renderProfiles } from "../../ui/workspaces/people.js";
import { renderProperty } from "../../ui/workspaces/property.js";

const workspaces = {
  librarySearch: { field: "librarySearch", render: renderImageLibrary },
  profileSearch: { field: "profileSearch", render: renderProfiles },
  propertySearch: { field: "propertySearch", render: renderProperty },
  calendarSearch: { field: "calendarSearch", render: renderCalendar },
  eventSearch: { field: "eventSearch", render: renderEvents },
  docSearch: { field: "docFilter", render: renderDocuments },
};
function updateInput(event) {
  const input = event.target,
    workspace = workspaces[input.id];
  if (workspace) state[workspace.field] = input.value;
  // Replacing an input during composition interrupts multilingual keyboard input.
  if (event.isComposing) return;
  if (workspace) {
    if (input.id === "eventSearch") state.eventLimit = 80;
    renderWithInputFocus(input, workspace.render);
    return;
  }
  if (input.id === "globalSearch") {
    state.searchLimit = 20;
    renderSearch();
  } else if (input.id === "networkSeedSearch") {
    const query = input.value.toLocaleLowerCase(getLocale());
    $$("[data-seed-name]").forEach((label) => {
      label.hidden = !label.dataset.seedName.includes(query);
    });
  } else if (input.id === "peopleSearch") renderPeople();
}
export function bindInputEvents() {
  document.addEventListener("input", updateInput);
  document.addEventListener("compositionend", updateInput);
}
