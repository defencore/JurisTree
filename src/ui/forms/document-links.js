import { recordConfigs } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { getLocale, translate as t } from "../../i18n/index.js";
import { documentSubjects } from "../../model/evidence.js";
import { documentRecordKey } from "../../model/document-links.js";
import { mediaTargetLabel } from "../../model/image-regions.js";
import { person } from "../../model/lookup.js";
import { relationshipLabel } from "../../model/relationship-labels.js";
import { checks } from "../components.js";
import { renderPersonChecks, bindPersonPickers } from "../person-picker.js";

export function renderDocumentLinks(source) {
  return `<section class="form-section document-links"><p class="field-caption">${t("ui.whoTheSourceIsLinkedTo")}</p><p class="hint">${t("ui.documentLibraryHint")}</p><p class="field-caption">${t("ui.whoThisDocumentIsAbout")}</p><p class="hint">${t("ui.selectTheChildForABirthCertificateOr")}</p>${renderPersonChecks("subjectIds", documentSubjects(source), t("ui.whoThisDocumentIsAbout"))}<details class="record-field-group"><summary>${t("ui.allMentionedOrRelatedPeople")}</summary>${renderPersonChecks("people", source.people || [], t("ui.allMentionedOrRelatedPeople"))}</details><details class="record-field-group" ${source.recordLinks?.length ? "open" : ""}><summary>${t("ui.documentProfileLinks")}</summary><p class="hint">${t("ui.documentProfileLinksHint")}</p><input type="search" data-document-record-query placeholder="${t("ui.documentRecordSearch")}" aria-label="${t("ui.documentRecordSearch")}"><div data-document-record-options class="document-record-options"></div></details><details class="record-field-group" ${source.relations?.length || source.propertyIds?.length ? "open" : ""}><summary>${t("ui.familyRelationships3")} · ${t("ui.property")}</summary>${checks(state.project.relations, "relations", source.relations || [], (r) => `${person(r.from)?.name} — ${person(r.to)?.name} (${relationshipLabel(r)})`)}${checks(state.project.property, "propertyIds", source.propertyIds || [], (asset) => asset.title)}</details></section>`;
}

export function bindDocumentLinks(form, source) {
  bindPersonPickers(form);
  const chosen = new Set((source.recordLinks || []).map(documentRecordKey));
  const choices = state.project.people
    .flatMap((profile) =>
      Object.entries(recordConfigs()).flatMap(([section, config]) =>
        (profile[config.key] || []).map((record) => {
          const target = { personId: profile.id, section, recordId: record.id };
          return {
            target,
            key: documentRecordKey(target),
            label: mediaTargetLabel(state.project, {
              kind: "record",
              ...target,
            }),
          };
        }),
      ),
    )
    .sort((a, b) => a.label.localeCompare(b.label, getLocale()));
  const root = form.querySelector("[data-document-record-options]"),
    query = form.querySelector("[data-document-record-query]");
  function render() {
    const people = new Set(
      [
        ...form.querySelectorAll(
          '[name="subjectIds"]:checked, [name="people"]:checked',
        ),
      ].map((input) => input.value),
    );
    const eligible = choices.filter(
      (choice) => people.has(choice.target.personId) || chosen.has(choice.key),
    );
    root.innerHTML = `<div class="check-grid">${eligible.map((choice) => `<label data-record-label="${esc(choice.label.toLowerCase())}"><input type="checkbox" name="recordLinks" value="${esc(choice.key)}" ${chosen.has(choice.key) ? "checked" : ""}>${esc(choice.label)}</label>`).join("")}</div>${eligible.length ? "" : `<p class="hint">${t("ui.documentNoRecordChoices")}</p>`}`;
    filter();
  }
  function filter() {
    const text = query.value.trim().toLowerCase();
    for (const label of root.querySelectorAll("[data-record-label]"))
      label.hidden = !label.dataset.recordLabel.includes(text);
  }
  form.addEventListener("change", (event) => {
    if (event.target.name === "recordLinks") {
      if (event.target.checked) chosen.add(event.target.value);
      else chosen.delete(event.target.value);
    }
    if (["subjectIds", "people"].includes(event.target.name)) render();
  });
  query.addEventListener("input", filter);
  query.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
    if (event.key === "Escape" && query.value) {
      event.preventDefault();
      event.stopPropagation();
      query.value = "";
      filter();
    }
  });
  render();
}
