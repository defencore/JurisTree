import { documentDetailsConfig } from "../../core/document-details.js";
import { documentTypeOptions } from "../document-catalog.js";
import { renderDocumentLinks, bindDocumentLinks } from "./document-links.js";
import { dateInput } from "../date-input.js";
import { defaultScopes, workspaceModes } from "../../core/workspace-modes.js";
import { evidenceTypes } from "../../core/config.js";
import { $, esc } from "../../core/dom.js";
import {
  sourceEvidence,
  sourceVerificationConfig,
} from "../../core/sources.js";
import { safeUrl } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { typeOptions } from "../components.js";
import { icon } from "../icons.js";
import { attachmentInput } from "../attachment-input.js";
import { renderRecordFields } from "./profile-record.js";

export function renderDocumentForm(old, chosenType, chosenEvidence) {
  return `<label class="field">${translate("ui.documentSourceTitle")}<input name="title" value="${esc(old.title)}" placeholder="${translate("ui.forExampleMariaSBirthCertificate")}" required maxlength="250"></label><div class="form-grid"><label class="field">${translate("ui.type")}<select name="type">${documentTypeOptions(chosenType)}</select></label><label class="field">${translate("ui.documentAvailability")}<select name="status">${typeOptions(
    {
      available: translate("ui.documentAvailable"),
      requested: translate("ui.requestedNotYetReceived"),
      not_found: translate("ui.notFound"),
      needs_review: translate("ui.recordAvailableNeedsReview"),
    },
    old.status,
  )}</select></label><label class="field">${translate("ui.evidenceType")}<select name="evidence">${typeOptions(evidenceTypes(), chosenEvidence)}</select><small>${translate("ui.sourceEvidenceHint")}</small></label><label class="field">${translate("ui.documentDate")}${dateInput("date", old.date, { freeText: true })}</label></div><details class="record-field-group" ${Object.keys(old.details || {}).length ? "open" : ""}><summary>${translate("ui.documentDetails")}${icon("chevron")}</summary>${renderRecordFields("document", documentDetailsConfig(), old.details || {})}</details>${attachmentInput()}<section class="form-section"><p class="field-caption">${icon("landmark")}${translate("ui.provenanceAndReferenceDetails")}</p><label class="field">${translate("ui.howAndFromWhomObtained")}<input name="source" value="${esc(old.source)}" placeholder="${translate("ui.familyOriginalInstitutionResponseWebsite")}" maxlength="1500"></label><div class="form-grid"><label class="field">${translate("ui.archiveInstitutionCollection")}<input name="repository" value="${esc(old.repository)}" maxlength="500"></label><label class="field">${translate("ui.collectionFileRecordNumberPage")}<input name="reference" value="${esc(old.reference)}" maxlength="1000"></label><label class="field full">${translate("ui.sourceCollectionTitle")}<input name="collectionTitle" value="${esc(old.collectionTitle)}" maxlength="1000"></label><label class="field">${translate("ui.sourceVolume")}<input name="volume" value="${esc(old.volume)}" maxlength="500"></label><label class="field">${translate("ui.sourcePages")}<input name="pages" value="${esc(old.pages)}" maxlength="500"></label><label class="field full">${translate("ui.externalSourceLink")}<input name="sourceUrl" type="url" value="${esc(old.sourceUrl || safeUrl(old.source))}" placeholder="https://…" maxlength="2000"></label><label class="field">${translate("ui.accessRetrievalDate")}${dateInput("accessedAt", old.accessedAt)}</label><label class="field">${translate("ui.documentLanguage")}<input name="language" value="${esc(old.language)}" placeholder="${translate("ui.ukrainianEnglish")}" maxlength="100"></label></div></section>${renderRecordFields("source", sourceVerificationConfig(), old)}${renderDocumentLinks(old)}<p class="field-caption">${icon("sliders")}${translate("ui.showThisSourceForPurposes")}</p><div class="check-grid">${Object.keys(
    defaultScopes,
  )
    .map(
      (key) =>
        `<label><input type="checkbox" name="purposes" value="${key}" ${!old.purposes?.length || old.purposes.includes(key) ? "checked" : ""}>${
          workspaceModes()[key].title
        }</label>`,
    )
    .join(
      "",
    )}</div><label class="field">${translate("ui.documentTextTranscription")}<textarea name="transcription" rows="4" maxlength="30000" placeholder="${translate("ui.transcribeNamesDatesAndOtherImportantPassages")}">${esc(old.transcription)}</textarea></label><label class="field">${translate("ui.findingsUncertaintiesAndNotes")}<textarea name="notes" maxlength="15000">${esc(old.notes)}</textarea></label>`;
}

export function bindDocumentForm(source) {
  const form = $("#modalForm");
  bindDocumentLinks(form, source);
  const evidence = form.elements.evidence;
  const update = () => {
    evidence.value = sourceEvidence({
      type: form.elements.type.value,
      evidence: evidence.value,
      verification: form.elements["source-verification"].value,
    });
  };
  for (const name of ["type", "evidence", "source-verification"])
    form.elements[name].addEventListener("change", update);
  update();
}
