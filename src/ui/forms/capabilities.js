import { relTypes, types } from "../../core/config.js";
import { translate } from "../../i18n/index.js";
import { icon } from "../icons.js";
export function renderCapabilitiesForm() {
  return `<div class="coverage-intro">${translate("ui.organizeInformationAndSourcesForBasicFamilyAnd")}</div><div class="coverage-grid"><section><h3>${icon("link")}${translate("ui.relationships3")} ${Object.keys(relTypes()).length}</h3><ul>${Object.values(
    relTypes(),
  )
    .map((t) => `<li>${t}</li>`)
    .join(
      "",
    )}</ul><p class="hint">${translate("ui.parenthoodAndAdoptionArrowsPointToTheChild")}</p></section><section><h3>${icon("sources")}${translate("ui.documents2")} ${Object.keys(types()).length}</h3><ul>${Object.values(
    types(),
  )
    .map((t) => `<li>${t}</li>`)
    .join(
      "",
    )}</ul><p class="hint">${translate("ui.useOtherDocumentWithAPreciseTitleAnd")}</p></section></div><section class="coverage-section"><h3>${translate("ui.whatYouCanStoreAndDisplay")}</h3><p>${translate("ui.exactOrPartialBirthAndDeathDatesFamily")}</p><p>${translate("ui.sourcesHaveAvailabilityAndEvidenceRatingsAnInstitution")}</p></section><section class="coverage-section"><h3>${translate("ui.documentsAndVerification")}</h3><p>${translate("ui.customizeChecklistsInPersonProfilesDocumentAvailabilityAnd")}</p><p>${translate("ui.photosAndLettersMayBeIndirectEvidenceKinship")}</p></section><section class="coverage-section"><h3>${translate("ui.filesAndPortability")}</h3><p>${translate("ui.editableZipIncludesTheMapAndAttachmentsJson")}</p><p class="hint">${translate("ui.perTree600People2500Relationships1")}</p></section>`;
}
