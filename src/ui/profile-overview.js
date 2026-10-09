import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { checks, sourceChips } from "./components.js";
import { icon } from "./icons.js";
import { fields } from "./profile-fields.js";

/** Optional summaries belong to the same section as their detailed records. */
export function profileOverviewEditor(cfg, person) {
  const overview = cfg.overview;
  if (!overview) return "";
  const populated =
    person[overview.field]?.trim() || person[overview.sourceIds]?.length;
  return `<details class="record-field-group profile-section-overview" data-profile-overview ${populated ? "open" : ""}><summary>${esc(overview.label)}${icon("chevron")}</summary><label class="field">${translate("ui.description")}<textarea name="${overview.field}" rows="4" maxlength="${overview.maximumLength}">${esc(person[overview.field])}</textarea></label><p class="field-caption">${translate("ui.supportingSources")}</p>${checks(state.project.documents, overview.sourceIds, person[overview.sourceIds] || [], (d) => d.title)}</details>`;
}

export function profileOverviewDetails(cfg, person) {
  const overview = cfg.overview;
  if (!overview) return "";
  return (
    fields([[overview.label, person[overview.field]]]) +
    sourceChips(person[overview.sourceIds])
  );
}
