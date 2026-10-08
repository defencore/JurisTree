import { types } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { profileEditors } from "../../features/profiles.js";
import { translate } from "../../i18n/index.js";
import { dateExact } from "../../model/dates.js";
import { typeOptions, checks } from "../components.js";
import { icon } from "../icons.js";
export function renderPersonForm(p, req, id) {
  return `<section class="form-section"><p class="field-caption">${icon("user")}${translate("ui.basicInformation")}</p><div class="form-grid"><label class="field full">${translate("ui.fullName")}<input name="name" value="${esc(p.name)}" placeholder="${translate("ui.firstAndLastName")}" required maxlength="150"></label><label class="field">${translate("ui.gender")}<select name="gender">${typeOptions(
    {
      u: translate("ui.notSpecified"),
      f: translate("ui.female"),
      m: translate("ui.male"),
    },
    p.gender,
  )}</select></label><label class="field">${translate("ui.status")}<select name="lifeStatus">${typeOptions(
    {
      unknown: translate("ui.unknown"),
      living: translate("ui.living"),
      deceased: translate("ui.deceased"),
    },
    p.death ? "deceased" : p.lifeStatus || "unknown",
  )}</select></label><label class="field">${translate("ui.exactBirthDate")}<input type="date" name="birthDate" value="${dateExact(p.birth)}"></label><label class="field">${translate("ui.orBirthYear")}<input name="birthYear" type="number" min="1" max="9999" value="${/^\d{4}$/.test(p.birth) ? p.birth : ""}" placeholder="${translate("ui.ifTheExactDateIsUnknown")}"></label><label class="field">${translate("ui.exactDeathDate")}<input type="date" name="deathDate" value="${dateExact(p.death)}"></label><label class="field">${translate("ui.orDeathYear")}<input name="deathYear" type="number" min="1" max="9999" value="${/^\d{4}$/.test(p.death) ? p.death : ""}" placeholder="${translate("ui.ifTheExactDateIsUnknown")}"></label><label class="field full">${translate("ui.placeOfOriginCountry")}<input name="place" value="${esc(p.place)}" maxlength="250"></label><label class="field full">${translate("ui.otherNamesAndSpellings")}<input name="aliases" value="${esc(p.aliases)}" placeholder="${translate("ui.maidenNameVariantsInOtherLanguages")}" maxlength="500"></label></div>${appState.project.groups.length ? `<p class="field-caption">${translate("ui.familyGroups")}</p>` + checks(appState.project.groups, "groupIds", p.groupIds || [], (g) => g.name) : ""}</section><details class="profile-editor-section"><summary>${icon("clipboard")}${translate("ui.requiredDocuments")}<span>${req.length}</span>${icon("chevron")}</summary><div><div class="check-grid">${Object.entries(
    types(),
  )
    .filter(([t]) => !["photo", "letter", "other"].includes(t))
    .map(
      ([t, l]) =>
        `<label><input type="checkbox" name="requirements" value="${t}" ${req.includes(t) ? "checked" : ""}>${esc(l)}</label>`,
    )
    .join(
      "",
    )}</div></div></details><section class="form-section"><label class="field">${translate("ui.treeResearchNotes")}<textarea name="notes" maxlength="15000">${esc(p.notes)}</textarea></label></section>${profileEditors(p)}<p class="hint">${translate("ui.profileSectionVisibilityHint")}</p>${id ? `<button type="button" class="btn small danger" data-delete-person="${id}">${icon("trash")}${translate("ui.deletePerson")}</button>` : ""}`;
}
