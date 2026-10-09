import { eventCategories } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { dateInput } from "../date-input.js";
import { sourceInScope } from "../../model/evidence.js";
import { personOptions, typeOptions } from "../components.js";
import { icon } from "../icons.js";
export function renderEventForm(eventId, owner, old) {
  return `<div class="form-grid"><label class="field full">${translate("ui.personForThisEvent")}<select name="personId" ${eventId ? "disabled" : ""}>${personOptions(owner.id)}</select></label><label class="field full">${translate("ui.eventTitle")}<input name="title" value="${esc(old.title)}" maxlength="1000" required placeholder="${translate("ui.weddingAnniversaryRelocationGraduation")}"></label><label class="field">${translate("ui.eventType")}<select name="category">${typeOptions(eventCategories(), old.category || "custom")}</select></label><label class="field">${translate("ui.date")}${dateInput("date", old.date)}</label><label class="field">${translate("ui.repeat")}<select name="repeat">${typeOptions(
    {
      none: translate("ui.oneTimeEvent"),
      annual: translate("ui.annualAnniversary2"),
    },
    old.repeat,
  )}</select></label><label class="field full">${translate("ui.source")}<select name="sourceId"><option value="">${translate("ui.noSource")}</option>${appState.project.documents
    .filter((d) => sourceInScope(d) || d.id === old.sourceId)
    .map(
      (d) =>
        `<option value="${d.id}" ${d.id === old.sourceId ? "selected" : ""}>${esc(d.title)}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field full">${translate("ui.description")}<textarea name="notes" maxlength="5000">${esc(old.notes)}</textarea></label></div>${eventId ? `<button type="button" class="btn small danger" data-delete-event="${eventId}" data-event-owner="${owner.id}">${icon("trash")}${translate("ui.deleteEvent")}</button>` : ""}`;
}
