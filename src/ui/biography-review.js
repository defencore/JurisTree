import { esc } from "../core/dom.js";
import { translate } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
import { icon } from "./icons.js";
import { sourceChips } from "./components.js";
import { sectionInfo } from "../core/config.js";

export function reviewButton(id) {
  return `<button type="button" class="btn biography-review-button" data-review-person="${id}">${icon("clipboard")}${translate("ui.biographyReview")}</button>`;
}

function list(title, records, render) {
  return `<section class="review-section"><h3>${esc(title)} <span class="pill">${records.length}</span></h3>${records.length ? `<ul>${records.map((r) => `<li>${render(r)}</li>`).join("")}</ul>` : `<p class="hint">${translate("ui.noInformationYet")}</p>`}</section>`;
}

export function renderReview(report) {
  const dates = (r) =>
    `${esc(displayDate(r.from))} — ${esc(displayDate(r.to))}`;
  const entry = (r) =>
    `<small>${esc(sectionInfo()[r.section][0])}</small>${esc(r.title)}${r.sourceId ? sourceChips([r.sourceId]) : ""}`;
  return `<div class="biography-review" data-review-report><p class="hint">${translate("ui.reviewCoverageHint")}</p><p><b>${translate("ui.reviewPeriod")}</b>: ${dates(report)}</p>${report.gaps.length ? list(translate("ui.uncoveredPeriods"), report.gaps, (r) => `${dates(r)} <span class="pill amber">${translate("ui.reviewDays", { days: r.days })}</span>`) : `<p class="note-box">${translate("ui.noUncoveredPeriods")}</p>`}${list(translate("ui.coveredPeriods"), report.coverage, (r) => `${dates(r)}<small>${r.records.map((r) => esc(r.title)).join(" · ")}</small>`)}${list(translate("ui.incompletePeriodRecords"), report.incomplete, entry)}${list(translate("ui.pendingProfileRecords"), report.pending, entry)}</div>`;
}
