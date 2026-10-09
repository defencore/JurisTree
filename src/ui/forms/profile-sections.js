import { recordConfigs } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import {
  profileCatalog,
  profileSectionCount,
} from "../../core/profile-catalog.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { checks } from "../components.js";
import { icon } from "../icons.js";
import { renderProfileRecord } from "./profile-record.js";

export function profileEditors(p) {
  const renderSection = ({ key: section, label, icon: ic, search }) => {
    let body = "";
    if (recordConfigs()[section]) {
      const cfg = recordConfigs()[section];
      body = `<div id="records-${section}">${(p[cfg.key] || []).map((r) => renderProfileRecord(section, r)).join("")}</div><button type="button" class="btn small" data-add-record="${section}">${icon("plus")}${translate("ui.addRecord")}</button>`;
    } else if (section === "biography") {
      body = `<label class="field">${translate("ui.lifeStoryAndHistoricalInformation")}<textarea name="biography" rows="6" maxlength="30000">${esc(p.biography)}</textarea></label><p class="field-caption">${translate("ui.supportingSources")}</p>${checks(appState.project.documents, "bioSourceIds", p.bioSourceIds || [], (d) => d.title)}`;
    } else if (section === "interests") {
      body = `<p class="hint">${translate("ui.datedInterestsHint")}</p><label class="field">${translate("ui.hobbies")}<textarea name="hobbies" maxlength="5000">${esc(p.hobbies)}</textarea></label><label class="field">${translate("ui.interests")}<textarea name="interests" maxlength="5000">${esc(p.interests)}</textarea></label>`;
    } else
      body = `<label class="field">${translate("ui.healthDetails")}<textarea name="health" rows="4" maxlength="10000">${esc(p.health)}</textarea></label><p class="field-caption">${translate("ui.relatedSources")}</p>${checks(appState.project.documents, "healthSourceIds", p.healthSourceIds || [], (d) => d.title)}`;
    return `<details class="profile-editor-section" data-profile-section="${section}" data-profile-panel="${section}" data-profile-keywords="${esc(search)}"><summary>${icon(ic)}${esc(label)}<span data-section-count="${section}">${profileSectionCount(p, section) || ""}</span>${icon("chevron")}</summary><div>${body}</div></details>`;
  };
  return profileCatalog()
    .map(
      (group) =>
        `<section class="profile-category" data-profile-category><h3>${esc(group.label)}</h3>${group.sections.map(renderSection).join("")}</section>`,
    )
    .join("");
}
