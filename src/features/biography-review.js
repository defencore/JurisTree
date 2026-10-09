import { $, esc } from "../core/dom.js";
import { translate } from "../i18n/index.js";
import {
  defaultReviewPeriod,
  reviewBiography,
} from "../model/biography-review.js";
import { person } from "../model/lookup.js";
import { renderReview } from "../ui/biography-review.js";
import { openDialog } from "../ui/dialog.js";

export function updateBiographyReview() {
  const host = $("#biographyReview");
  if (!host) return;
  try {
    const report = reviewBiography(person(host.dataset.personId), {
      from: $("#reviewFrom").value,
      to: $("#reviewTo").value,
      minimumDays: $("#reviewMinimumDays").value,
      mode: $("#reviewMode").value,
    });
    $("#reviewResults").innerHTML = renderReview(report);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    $("#reviewResults").innerHTML =
      `<p class="note-box">${translate("ui.reviewDatesRequired")}</p>`;
  }
}

export function openBiographyReview(id) {
  const p = person(id);
  if (!p) return;
  const period = defaultReviewPeriod(p);
  return openDialog(
    translate("ui.biographyReview"),
    `<div id="biographyReview" data-person-id="${p.id}"><h2>${esc(p.name)}</h2><div class="form-grid"><label class="field">${translate("ui.reviewFrom")}<input type="date" id="reviewFrom" value="${period.from}"></label><label class="field">${translate("ui.reviewTo")}<input type="date" id="reviewTo" value="${period.to}"></label><label class="field">${translate("ui.minimumGapDays")}<input type="number" min="1" step="1" id="reviewMinimumDays" value="180"></label><label class="field">${translate("ui.reviewEvidenceMode")}<select id="reviewMode"><option value="all">${translate("ui.allDatedRecords")}</option><option value="corroborated">${translate("ui.corroboratedPeriods")}</option></select></label></div><button type="button" class="btn" data-action="update-biography-review">${translate("ui.reviewUpdate")}</button><div id="reviewResults" aria-live="polite"></div></div>`,
    { wide: true, footer: false, onOpen: updateBiographyReview },
  );
}
