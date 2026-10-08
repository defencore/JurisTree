import {
  sourceVerificationConfig,
  sourceEvidence,
} from "../../core/sources.js";
import { renderRecordFields } from "./profile-record.js";
import {
  types,
  evidenceTypes,
  relTypes,
  defaultScopes,
} from "../../core/config.js";
import { $, esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { bytes, safeUrl } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { documentSubjects } from "../../model/evidence.js";
import { person } from "../../model/project.js";
import { typeOptions, checks } from "../components.js";
import { icon } from "../icons.js";
export function renderDocumentForm(file, old, chosenType, id, chosenEvidence) {
  return `${file ? `<div class="upload-info">${icon("paperclip")} ${esc(file.name)} · ${bytes(file.blob.size)}${file.originalSize ? ` ${translate("ui.original")} ` + bytes(file.originalSize) : ""}</div>` : ""}<label class="field">${translate("ui.documentSourceTitle")}<input name="title" value="${esc(old.title)}" placeholder="${translate("ui.forExampleMariaSBirthCertificate")}" required maxlength="250"></label><div class="form-grid"><label class="field">${translate("ui.type")}<select name="type">${typeOptions(types(), chosenType)}</select></label><label class="field">${translate("ui.documentAvailability")}<select name="status">${typeOptions(
    {
      available: translate("ui.documentAvailable"),
      requested: translate("ui.requestedNotYetReceived"),
      not_found: translate("ui.notFound"),
      needs_review: translate("ui.recordAvailableNeedsReview"),
    },
    file && id ? "needs_review" : old.status,
  )}</select></label><label class="field">${translate("ui.evidenceType")}<select name="evidence">${typeOptions(evidenceTypes(), chosenEvidence)}</select><small>${translate("ui.sourceEvidenceHint")}</small></label><label class="field">${translate("ui.documentDate")}<input name="date" value="${esc(old.date)}" placeholder="${translate("ui.dateOrYear")}" maxlength="60"></label></div><section class="form-section"><p class="field-caption">${icon("landmark")}${translate("ui.provenanceAndReferenceDetails")}</p><label class="field">${translate("ui.howAndFromWhomObtained")}<input name="source" value="${esc(old.source)}" placeholder="${translate("ui.familyOriginalInstitutionResponseWebsite")}" maxlength="1500"></label><div class="form-grid"><label class="field">${translate("ui.archiveInstitutionCollection")}<input name="repository" value="${esc(old.repository)}" maxlength="500"></label><label class="field">${translate("ui.collectionFileRecordNumberPage")}<input name="reference" value="${esc(old.reference)}" maxlength="1000"></label><label class="field full">${translate("ui.externalSourceLink")}<input name="sourceUrl" type="url" value="${esc(old.sourceUrl || safeUrl(old.source))}" placeholder="https://…" maxlength="2000"></label><label class="field">${translate("ui.accessRetrievalDate")}<input name="accessedAt" type="date" value="${esc(old.accessedAt)}"></label><label class="field">${translate("ui.documentLanguage")}<input name="language" value="${esc(old.language)}" placeholder="${translate("ui.ukrainianEnglish")}" maxlength="100"></label></div></section>${renderRecordFields("source", sourceVerificationConfig(), old)}<section class="form-section"><p class="field-caption">${icon("link")}${translate("ui.whoTheSourceIsLinkedTo")}</p><p class="hint">${translate("ui.aDocumentCanLinkToMultiplePeopleAnd")}</p><p class="field-caption">${translate("ui.whoThisDocumentIsAbout")}</p><p class="hint">${translate("ui.selectTheChildForABirthCertificateOr")}</p>${checks(appState.project.people, "subjectIds", documentSubjects(old), (x) => x.name)}<p class="field-caption">${translate("ui.allMentionedOrRelatedPeople")}</p>${checks(appState.project.people, "people", old.people, (x) => x.name)}<p class="field-caption">${translate("ui.familyRelationships3")}</p>${checks(appState.project.relations, "relations", old.relations, (x) => `${person(x.from)?.name} — ${person(x.to)?.name} (${relTypes()[x.type]})`)}${appState.project.property.length ? `<p class="field-caption">${translate("ui.property")}</p>` + checks(appState.project.property, "propertyIds", old.propertyIds || [], (x) => x.title) : ""}</section><p class="field-caption">${icon("sliders")}${translate("ui.showThisSourceForPurposes")}</p><div class="check-grid">${Object.keys(
    defaultScopes,
  )
    .map(
      (key) =>
        `<label><input type="checkbox" name="purposes" value="${key}" ${(old.purposes || Object.keys(defaultScopes)).includes(key) ? "checked" : ""}>${
          {
            family: translate("ui.familyHistory"),
            inheritance: translate("ui.inheritance"),
            property: translate("ui.propertyAllocation"),
            research: translate("ui.relationshipResearch"),
          }[key]
        }</label>`,
    )
    .join(
      "",
    )}</div><label class="field">${translate("ui.documentTextTranscription")}<textarea name="transcription" rows="4" maxlength="30000" placeholder="${translate("ui.transcribeNamesDatesAndOtherImportantPassages")}">${esc(old.transcription)}</textarea></label><label class="field">${translate("ui.findingsUncertaintiesAndNotes")}<textarea name="notes" maxlength="15000">${esc(old.notes)}</textarea></label>`;
}

export function bindDocumentForm() {
  const form = $("#modalForm");
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
