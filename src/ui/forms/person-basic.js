import { esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { dateExact } from "../../model/dates.js";
import { checks, typeOptions } from "../components.js";
import { icon } from "../icons.js";

export function renderPersonBasics(p, creationLinks = "") {
  return `<section class="form-section" data-profile-panel="basic"><p class="field-caption">${icon("user")}${translate("ui.basicInformation")}</p><div class="form-grid"><label class="field full">${translate("ui.fullName")}<input name="name" value="${esc(p.name)}" placeholder="${translate("ui.firstAndLastName")}" required maxlength="150"></label><label class="field">${translate("ui.gender")}<select name="gender">${typeOptions(
    {
      u: translate("ui.notSpecified"),
      x: translate("ui.nonbinaryOther"),
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
  )}</select></label></div>${creationLinks}<div class="form-grid"><label class="field">${translate("ui.exactBirthDate")}<input type="date" name="birthDate" value="${dateExact(p.birth)}"></label><label class="field">${translate("ui.orBirthYear")}<input name="birthYear" type="number" min="1" max="9999" value="${/^\d{4}$/.test(p.birth) ? p.birth : ""}" placeholder="${translate("ui.ifTheExactDateIsUnknown")}"></label><label class="field">${translate("ui.exactDeathDate")}<input type="date" name="deathDate" value="${dateExact(p.death)}"></label><label class="field">${translate("ui.orDeathYear")}<input name="deathYear" type="number" min="1" max="9999" value="${/^\d{4}$/.test(p.death) ? p.death : ""}" placeholder="${translate("ui.ifTheExactDateIsUnknown")}"></label><label class="field full">${translate("ui.placeOfOriginCountry")}<input name="place" value="${esc(p.place)}" maxlength="250"></label><label class="field full">${translate("ui.otherNamesAndSpellings")}<input name="aliases" value="${esc(p.aliases)}" placeholder="${translate("ui.maidenNameVariantsInOtherLanguages")}" maxlength="500"></label></div>${appState.project.groups.length ? `<p class="field-caption">${translate("ui.familyGroups")}</p>` + checks(appState.project.groups, "groupIds", p.groupIds || [], (g) => g.name) : ""}</section>`;
}
