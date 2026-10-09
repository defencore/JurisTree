import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { getLocale, translate } from "../i18n/index.js";
import { personDisplayName, personLifeDates } from "../model/person-display.js";
import { requirements } from "../model/evidence.js";
import { personPassesFilter } from "../model/person-filter-state.js";
import { withProjectIndex } from "../model/project.js";
import { orderedPeople } from "../model/person-selection.js";
import { avatar, biographyButton } from "./components.js";
import { icon } from "./icons.js";
import { personStatusMarkup } from "./person-status.js";

export function renderPeople() {
  if (!appState.project) return;
  return withProjectIndex(renderPeopleAll);
}
export function renderPeopleAll() {
  const q = $("#peopleSearch").value.toLocaleLowerCase(getLocale());
  const ps = orderedPeople(appState.project.people).filter(
    (p) =>
      personPassesFilter(p.id) &&
      (!appState.groupFilter ||
        (p.groupIds || []).includes(appState.groupFilter)) &&
      [
        p.name,
        p.aliases,
        ...(p.nameHistory || []).flatMap((r) => [r.fullName, r.surname]),
      ]
        .join(" ")
        .toLocaleLowerCase(getLocale())
        .includes(q),
  );
  $("#personList").innerHTML =
    ps
      .map((p) => {
        const missing = requirements(p).filter((t) => !t.done).length,
          dates = personLifeDates(p),
          status = missing
            ? `${translate("ui.missingDocuments")} ` + missing
            : translate("ui.documentsCollected");
        return `<div class="person-row ${appState.selected?.kind === "person" && appState.selected.id === p.id ? "selected" : ""}"><button type="button" class="person-select" data-person="${p.id}" aria-label="${esc(personDisplayName(p) + (dates ? ", " + dates : "") + ". " + status)}" ${appState.selected?.kind === "person" && appState.selected.id === p.id ? 'aria-current="true"' : ""}>${avatar(p)}<span class="person-row-text"><b>${esc(personDisplayName(p))}</b><small>${esc(dates)}</small>${personStatusMarkup(p)}</span><span class="row-state ${missing ? "" : "ready"}" title="${status}">${icon(missing ? "fileMissing" : "fileCheck")}${missing ? `<span>${missing}</span>` : ""}</span></button>${biographyButton(p, true)}</div>`;
      })
      .join("") ||
    `<p class="hint">${q || appState.personFilter.rules.length ? translate("ui.noPeopleMatchThisSearch") : translate("ui.noPeopleYetAddTheFirstPerson")}</p>`;
}
