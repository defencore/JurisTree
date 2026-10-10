import { state } from "../core/state.js";
import { personImageItems } from "../model/image-regions.js";
import { biographyImages } from "./biography-images.js";
import { recordConfigs, sectionInfo } from "../core/config.js";
import { esc } from "../core/dom.js";
import {
  profileCatalog,
  profileSectionCount,
} from "../core/profile-catalog.js";
import { translate } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
import { profileScope } from "../model/profile-scope.js";
import { recordAttachmentsButton } from "./record-attachments.js";
import { profileOverviewDetails } from "./profile-overview.js";
import { sourceChips } from "./components.js";
import { icon } from "./icons.js";
import {
  fields,
  recordValues,
  recordReferenceActions,
} from "./profile-fields.js";

export function recordDetails(section, r, personId) {
  const attachments =
    biographyImages(
      personImageItems(state.project, personId, { section, recordId: r.id }),
    ) + recordAttachmentsButton(personId, section, r);
  const cfg = recordConfigs()[section];
  if (cfg.extended)
    return `<div class="biography-record">${fields(recordValues(cfg, r))}${r.sourceId ? sourceChips([r.sourceId]) : ""}${recordReferenceActions(cfg, r)}${attachments}</div>`;
  const ic =
    section === "pets"
      ? {
          dog: "dog",
          cat: "cat",
          bird: "bird",
          fish: "fish",
        }[r.type] || "paw"
      : sectionInfo()[section][1];
  const title =
    r.title ||
    r.label ||
    r.address ||
    r.organization ||
    r.name ||
    r.value ||
    translate("ui.record");
  let lines = [];
  if (section === "timeline")
    lines = [
      displayDate(r.date) +
        (r.repeat === "annual" ? ` ${translate("ui.annualAnniversary")}` : ""),
    ];
  else if (section === "pets")
    lines = [
      r.birth ? `${translate("ui.birth2")} ` + displayDate(r.birth) : "",
      r.death ? `${translate("ui.death")} ` + displayDate(r.death) : "",
    ];
  else
    lines = [
      r.role || "",
      r.from || r.to
        ? displayDate(r.from) +
          " — " +
          (displayDate(r.to) || translate("ui.present"))
        : "",
      r.location || "",
    ];
  return `<div class="detail-record"><span class="detail-record-icon">${icon(ic)}</span><div><b>${esc(title)}</b>${lines
    .filter(Boolean)
    .map((l) => `<small>${section === "contacts" ? l : esc(l)}</small>`)
    .join(
      "",
    )}${r.notes ? `<p>${esc(r.notes)}</p>` : ""}${r.sourceId ? sourceChips([r.sourceId]) : ""}${attachments}</div></div>`;
}
export function renderPersonDetails(p, { complete = false } = {}) {
  const renderSection = ({ key: section, search }) => {
    const [label, ic] = sectionInfo()[section];
    let body = "";
    if (recordConfigs()[section]) {
      const cfg = recordConfigs()[section];
      body =
        profileOverviewDetails(cfg, p) +
        (p[cfg.key] || []).map((r) => recordDetails(section, r, p.id)).join("");
    } else if (section === "biography")
      body =
        (p.biography ? `<div class="note-box">${esc(p.biography)}</div>` : "") +
        sourceChips(p.bioSourceIds);
    return `<details class="profile-details" ${section === "biography" || section === "timeline" ? "open" : ""} ${complete ? `data-profile-panel="${section}" data-profile-keywords="${esc(search)}"` : ""}><summary>${icon(ic)}${esc(label)}<span class="profile-record-count">${profileSectionCount(p, section) || ""}</span>${icon("chevron")}</summary><div>${body || `<p class="kin-empty">${translate("ui.noInformationYet")}</p>`}<button class="btn small ghost" data-open-profile-section="${section}" data-profile-person="${p.id}">${icon("edit")}${translate("ui.edit")}</button></div></details>`;
  };
  const visible = profileScope();
  return profileCatalog()
    .map((group) => {
      const sections = group.sections.filter(
        ({ key }) => complete || visible.includes(key),
      );
      const html = sections.map(renderSection).join("");
      return complete
        ? `<section class="profile-category" data-profile-category><h3>${esc(group.label)}</h3>${html}</section>`
        : html;
    })
    .join("");
}
