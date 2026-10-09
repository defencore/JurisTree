import { sectionInfo } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { profileGroups } from "../../core/profile-groups.js";
import { translate } from "../../i18n/index.js";
import { icon } from "../icons.js";

export function renderProfileScopeForm(project, visible) {
  return `<div class="upload-info">${esc(
    {
      family: translate("ui.familyHistory"),
      inheritance: translate("ui.inheritance"),
      property: translate("ui.propertyAllocation"),
      research: translate("ui.relationshipResearch"),
    }[project.purpose],
  )}</div><p class="hint">${translate("ui.peopleFamilyRelationshipsAndDocumentsAreAlwaysAvailable")}</p>${profileGroups()
    .map(
      (group) =>
        `<section class="profile-category"><h3>${esc(group.label)}</h3><div class="check-grid">${group.sections
          .map((key) => {
            const [label, symbol] = sectionInfo()[key];
            return `<label><input type="checkbox" name="sections" value="${key}" ${visible.includes(key) ? "checked" : ""}>${icon(symbol)}${esc(label)}</label>`;
          })
          .join("")}</div></section>`,
    )
    .join("")}`;
}
