import { esc } from "../../core/dom.js";
import { translate } from "../../i18n/index.js";
import { icon } from "../icons.js";
import { profileNavigation } from "../profile-navigation.js";
import { renderPersonBasics } from "./person-basic.js";
import { renderPersonChecklist } from "./person-checklist.js";
import { renderCreationLinks } from "./person-links.js";
import { profileEditors } from "./profile-sections.js";

export function renderPersonForm(p, req, id, linkTargets = []) {
  const content =
    renderPersonBasics(p, id ? "" : renderCreationLinks(linkTargets)) +
    renderPersonChecklist(req) +
    `<section class="form-section" data-profile-panel="notes"><label class="field">${translate("ui.treeResearchNotes")}<textarea name="notes" maxlength="15000">${esc(p.notes)}</textarea></label></section>${profileEditors(p)}${id ? `<button type="button" class="btn small danger" data-delete-person="${id}">${icon("trash")}${translate("ui.deletePerson")}</button>` : ""}`;
  const extra = [
    { key: "basic", label: translate("ui.basicInformation"), icon: "user" },
    {
      key: "requirements",
      label: translate("ui.requiredDocuments"),
      icon: "clipboard",
    },
    {
      key: "notes",
      label: translate("ui.treeResearchNotes"),
      icon: "notebook",
    },
  ];
  return `<div class="person-editor" data-profile-editor>${profileNavigation(p, extra)}<div class="profile-editor-content"><p class="profile-editor-intro">${translate("ui.completeProfileEditorHint")}</p><p class="empty-search" data-profile-no-results hidden>${translate("ui.noProfileSections")}</p>${content}</div></div>`;
}
