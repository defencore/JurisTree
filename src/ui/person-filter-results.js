import { personDisplayName } from "../model/person-display.js";
import { esc } from "../core/dom.js";
import { getLocale, translate as t } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
export function formatFilterAssets(fact) {
  return Object.entries(fact.assetValue)
    .map(
      ([c, v]) =>
        new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(
          v,
        ) +
        " " +
        c,
    )
    .join(" · ");
}
export function formatFilterAge(fact) {
  if (!fact.age) return t("ui.unknown");
  return (
    (fact.age.approximate ? "≈ " : "") +
    (fact.age.min === fact.age.max
      ? String(fact.age.min)
      : `${fact.age.min}–${fact.age.max}`)
  );
}
export function renderPersonFilterResults(report, limit = 30) {
  return `<h3>${t("ui.filterResults")} <span data-filter-result-count>${report.matches.length} / ${report.total}</span></h3><div class="filter-statistics">${[
    ["living", "ui.living"],
    ["deceased", "ui.deceased"],
    ["minors", "ui.filterMinor"],
    ["withoutDocuments", "ui.filterWithoutDocuments"],
    ["unknownAge", "ui.filterUnknownAge"],
  ]
    .map(
      ([key, label]) =>
        `<div><b>${report.summary[key]}</b><span>${t(label)}</span></div>`,
    )
    .join(
      "",
    )}</div>${report.summary.incompleteAssets ? `<p class="hint">${t("ui.filterIncompleteAssets")} ${report.summary.incompleteAssets}</p>` : ""}<div class="filter-result-list">${
    report.matches
      .slice(0, limit)
      .map(
        (f) =>
          `<button type="button" class="filter-person-result" data-filter-command="person" data-id="${f.id}"><b>${esc(personDisplayName(f.person))}</b><span>${t("ui.filterAge")}: ${formatFilterAge(f)} · ${t("ui.filterRecordedChildren")}: ${f.children} · ${t("ui.filterAvailableDocuments")}: ${f.documents}</span>${formatFilterAssets(f) ? `<small>${t("ui.filterAssetValue")}: ${esc(formatFilterAssets(f))}</small>` : ""}${f.birthdayDate ? `<small>${t("ui.birthday")}: ${displayDate(f.birthdayDate)}</small>` : ""}${f.anniversaryDate ? `<small>${t("ui.filterNextAnniversary")}: ${displayDate(f.anniversaryDate)}</small>` : ""}</button>`,
      )
      .join("") || `<p class="hint">${t("ui.filterNoMatches")}</p>`
  }</div>${report.matches.length > limit ? `<button type="button" class="btn" data-filter-command="more">${t("ui.moreSearchResults")} · ${Math.min(limit, report.matches.length)}/${report.matches.length}</button>` : ""}`;
}
