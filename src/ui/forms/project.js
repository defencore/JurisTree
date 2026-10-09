import { esc } from "../../core/dom.js";
import { translate } from "../../i18n/index.js";

export function renderProjectForm(project) {
  return `<label class="field">${translate("ui.title")}<input name="title" value="${esc(project.title)}" required maxlength="150"></label><label class="field">${translate("ui.countryJurisdiction")}<input name="jurisdiction" value="${esc(project.jurisdiction)}" placeholder="${translate("ui.forExampleUsaPennsylvania")}" maxlength="250"><small>${translate("ui.forReferenceOnlyDocumentRequirementsAreNotDetermined")}</small></label>`;
}
