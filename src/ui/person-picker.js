import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate as t } from "../i18n/index.js";
import { personDisplayName, personLifeDates } from "../model/person-display.js";
import {
  matchesPersonName,
  orderedPeople,
  personNameIndex,
} from "../model/person-selection.js";
import { checks, personOption, personOptions } from "./components.js";

const bound = new WeakSet();

function searchField(context) {
  return `<input type="search" data-person-query maxlength="200" autocomplete="off" placeholder="${t("ui.findPersonByName")}" aria-label="${esc(t("ui.findPersonByName") + ": " + context)}">`;
}

export function renderPersonPicker(
  name,
  selectedId,
  label,
  { empty = false, required = false, labelId = "" } = {},
) {
  const id = `person-picker-${uid()}`;
  return `<div class="field person-picker" data-person-picker data-empty="${empty}"><label for="${id}" ${labelId ? `id="${labelId}"` : ""}>${esc(label)}</label>${searchField(label)}<select id="${id}" name="${name}" ${required ? "required" : ""}>${personOptions(selectedId, empty)}</select><small data-person-results role="status">${t("ui.peopleSortedBySurname")}</small></div>`;
}

export function renderPersonChecks(name, selectedIds, label) {
  return `<div class="person-members" data-person-members>${searchField(label)}<small data-person-results role="status"></small>${checks(orderedPeople(state.project.people), name, selectedIds, (p) => [personDisplayName(p), personLifeDates(p)].filter(Boolean).join(" · "))}<p class="hint" data-person-empty hidden>${t("ui.noPeopleMatchThisSearch")}</p></div>`;
}

/** Filter choices without changing the current value or removing checked members. */
export function bindPersonPickers(root) {
  root
    .querySelectorAll("[data-person-picker], [data-person-members]")
    .forEach((picker) => {
      if (bound.has(picker)) return;
      bound.add(picker);
      const people = orderedPeople(state.project.people);
      const indexes = new Map(people.map((p) => [p.id, personNameIndex(p)]));
      const query = picker.querySelector("[data-person-query]");
      const status = picker.querySelector("[data-person-results]");
      const select = picker.querySelector("select");
      const members = [
        ...picker.querySelectorAll('.check-grid input[type="checkbox"]'),
      ];
      const emptyOption =
        picker.dataset.empty === "true"
          ? `<option value="">${t("ui.notSelected")}</option>`
          : "";

      function update() {
        const matches = people.filter((p) =>
          matchesPersonName(indexes.get(p.id), query.value),
        );
        const ids = new Set(matches.map((p) => p.id));
        let retained = false;
        if (select) {
          const selectedId = select.value;
          const selected = people.find((p) => p.id === selectedId);
          retained = selected && !ids.has(selectedId);
          select.innerHTML =
            emptyOption +
            (retained
              ? `<optgroup label="${t("ui.currentSelection")}">${personOption(selected, selectedId)}</optgroup>`
              : "") +
            matches.map((p) => personOption(p, selectedId)).join("");
          select.value = selectedId;
        } else {
          members.forEach((input) => {
            input.closest("label").hidden = !ids.has(input.value);
          });
          picker.querySelector("[data-person-empty]").hidden =
            matches.length > 0;
        }
        status.textContent = [
          t("ui.matchingPeopleCount", {
            count: matches.length,
            total: people.length,
          }),
          select && !matches.length ? t("ui.noPeopleMatchThisSearch") : "",
          select
            ? ""
            : t("ui.selectedPeopleCount", {
                count: members.filter((input) => input.checked).length,
              }),
          retained
            ? t("ui.personSelectionRetained")
            : t("ui.peopleSortedBySurname"),
        ]
          .filter(Boolean)
          .join(" · ");
      }
      query.addEventListener("input", update);
      picker.addEventListener("change", update);
      query.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || (select && event.key === "ArrowDown")) {
          event.preventDefault();
          (
            select || members.find((input) => !input.closest("label").hidden)
          )?.focus();
        } else if (event.key === "Escape" && query.value) {
          event.preventDefault();
          event.stopPropagation();
          query.value = "";
          update();
        }
      });
      update();
    });
}
