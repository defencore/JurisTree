import { esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { propertyRecordConfigs } from "../../core/property-records.js";
import { propertyDocumentKey } from "../../model/property-document-links.js";
import { displayDate } from "../../model/dates.js";
import { getLocale, translate as t } from "../../i18n/index.js";

export function renderPropertyDocumentLinks(source) {
  return `<details class="record-field-group" ${source.propertyRecordLinks?.length ? "open" : ""}><summary>${t("ui.evidencePropertyFacts")}</summary><p class="hint">${t("ui.evidencePropertyFactsHint")}</p><input type="search" data-property-record-query placeholder="${t("ui.search")}" aria-label="${t("ui.evidencePropertyFacts")}"><div data-property-record-options class="document-record-options"></div></details>`;
}
export function bindPropertyDocumentLinks(form, source) {
  const root = form.querySelector("[data-property-record-options]"),
    query = form.querySelector("[data-property-record-query]");
  const chosen = new Set(
    (source.propertyRecordLinks || []).map(propertyDocumentKey),
  );
  const choices = (assetIds) =>
    state.project.property
      .filter((asset) => assetIds.has(asset.id))
      .flatMap((asset) =>
        Object.entries(propertyRecordConfigs()).flatMap(([kind, config]) =>
          (asset[kind] || []).map((record) => ({
            propertyId: asset.id,
            key: propertyDocumentKey({
              propertyId: asset.id,
              kind,
              recordId: record.id,
            }),
            label: [
              asset.title,
              config.label,
              displayDate(record.date || record.from),
              record.reference,
              record.grounds,
            ]
              .filter(Boolean)
              .join(" · "),
          })),
        ),
      )
      .sort((a, b) => a.label.localeCompare(b.label, getLocale()));
  const filter = () => {
    const text = query.value.trim().toLowerCase();
    for (const label of root.querySelectorAll("label"))
      label.hidden = !label.textContent.toLowerCase().includes(text);
  };
  function render() {
    const assets = new Set(
      [...form.querySelectorAll('[name="propertyIds"]:checked')]
        .map((input) => input.value)
        .concat([...chosen].map((key) => key.split(":")[0])),
    );
    root.innerHTML = `<div class="check-grid">${choices(assets)
      .map(
        (c) =>
          `<label><input type="checkbox" name="propertyRecordLinks" value="${esc(c.key)}" ${chosen.has(c.key) ? "checked" : ""}>${esc(c.label)}</label>`,
      )
      .join("")}</div>`;
    filter();
  }
  form.addEventListener("change", (event) => {
    if (event.target.name === "propertyIds") render();
    if (event.target.name === "propertyRecordLinks") {
      if (event.target.checked) chosen.add(event.target.value);
      else chosen.delete(event.target.value);
    }
  });
  query.addEventListener("input", filter);
  query.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  render();
}
