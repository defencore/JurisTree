import { relTypes } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { isDirectedRelationship } from "../core/professional-relationships.js";
import { relationshipConfig } from "../core/relationships.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import { edgeState, linkedDocs, requirements } from "../model/evidence.js";
import { relationShown } from "../model/graph-view.js";
import { doc, group, person, relation } from "../model/lookup.js";
import { roleLabel } from "../model/relationship-labels.js";
import { reviewButton } from "./biography-review.js";
import {
  avatar,
  biographyButton,
  miniDoc,
  requirementCard,
} from "./components.js";
import { favoriteButton } from "./favorites.js";
import { windowControls } from "./floating-windows.js";
import { kinGroups } from "./groups.js";
import { icon } from "./icons.js";
import { personStatusMarkup } from "./person-status.js";
import { renderPersonDetails } from "./profile-details.js";
import { fields, recordValues } from "./profile-fields.js";

export function renderInspector() {
  let html = `<div class="inspector-header" tabindex="0" title="${translate("ui.moveWindowHint")}"><b>${translate("ui.personDetails")}</b><div class="window-head-actions">${windowControls()}<button class="iconbtn mobile-only" data-action="close-panel" aria-label="${translate("ui.closeDetails")}">${icon("panelClose")}</button></div></div>`;
  if (!appState.selected) {
    $("#inspector").innerHTML =
      html +
      `<div class="empty">${icon("users")}<h2>${translate("ui.yourFamilyOnTheMap")}</h2><p>${translate("ui.selectAPersonToViewTheirParentsChildren")}</p><button class="btn primary" data-action="add-person">${icon("plus")}${translate("ui.addPerson")}</button></div>`;
    return;
  }
  if (appState.selected.kind === "person") {
    const p = person(appState.selected.id);
    if (!p) return;
    const req = requirements(p),
      done = req.filter((t) => t.done).length,
      ds = linkedDocs("person", p.id);
    html += `<div class="profile"><div class="profile-top">${avatar(p)}<div><h2>${esc(p.name)}</h2><p>${esc(years(p))}${p.place ? "<br>" + esc(p.place) : ""}</p></div></div>${personStatusMarkup(p)}<div class="pills"><span class="pill ${done === req.length ? "teal" : "amber"}">${icon(done === req.length ? "fileCheck" : "fileMissing")}${done} / ${req.length} ${translate("ui.documentsAvailable")}</span>${(
      p.groupIds || []
    )
      .map(group)
      .filter(Boolean)
      .map((g) => `<span class="pill">${esc(g.name)}</span>`)
      .join(
        "",
      )}${p.id === appState.project.subjectId ? `<span class="pill blue">${icon("fingerprint")}${translate("ui.ownerDeceasedEstateOwner")}</span>` : ""}${p.id === appState.project.claimantId ? `<span class="pill teal">${icon("user")}${translate("ui.claimant")}</span>` : ""}</div></div><div class="profile-actions">${favoriteButton(p)}<button class="btn small" data-edit-person="${p.id}">${icon("edit")}${translate("ui.edit")}</button><button class="btn small" data-portrait="${p.id}">${icon("photo")}${translate("ui.photo")}</button></div><button class="btn compare-profile" data-action="compare">${icon("compare")}${translate("ui.howAreWeRelated")}</button><button class="btn full-profile-button" data-full-profile="${p.id}">${icon("user")}${translate("ui.openFullProfile")}${icon("arrowRight")}</button>${biographyButton(p)}${reviewButton(p.id)}${kinGroups(p)}<div class="panel-section"><div class="panel-title"><h3>${translate("ui.requiredDocuments")}</h3><small>${done} / ${req.length} ${translate("ui.available2")}</small></div><div class="progress"><i style="width:${req.length ? (done / req.length) * 100 : 100}%"></i></div>${req.map((t) => requirementCard(p, t)).join("") || `<p class="hint">${translate("ui.configureTheChecklistInThePersonProfile")}</p>`}</div><div class="panel-section"><div class="panel-title"><h3>${translate("ui.sourcesForThisPerson")}</h3><button class="btn small ghost" data-add-for="${p.id}">${icon("plus")}${translate("ui.add")}</button></div>${ds.map(miniDoc).join("") || `<p class="kin-empty">${translate("ui.noCertificatesPhotosOrArchiveRecordsAddedYet")}</p>`}</div>${renderPersonDetails(p)}${p.aliases ? `<div class="panel-section"><div class="panel-title"><h3>${translate("ui.otherNames")}</h3></div><div class="note-box">${esc(p.aliases)}</div></div>` : ""}${p.notes ? `<div class="panel-section"><div class="panel-title"><h3>${translate("ui.notes")}</h3></div><div class="note-box">${esc(p.notes)}</div></div>` : ""}`;
  } else if (appState.selected.kind === "relation") {
    const r = relation(appState.selected.id);
    if (!r) return;
    const a = person(r.from),
      b = person(r.to),
      state = edgeState(r),
      ds = linkedDocs("relation", r.id);
    const labels = {
      official: translate("ui.officialSourceAvailable"),
      indirect: translate("ui.indirectEvidenceAvailable"),
      missing: translate("ui.documentMissing2"),
      review: translate("ui.sourceNeedsReview"),
      requested: translate("ui.documentRequested"),
      conflict: translate("ui.disputedRelationship"),
    };
    html = `<div class="inspector-header" tabindex="0" title="${translate("ui.moveWindowHint")}"><b>${translate("ui.relationshipDetails")}</b><div class="window-head-actions">${windowControls()}<button class="iconbtn mobile-only" data-action="close-panel" aria-label="${translate("ui.closeDetails")}">${icon("panelClose")}</button></div></div><div class="profile"><h2>${esc(relTypes()[r.type])}</h2><div class="rel-direction"><div><small>${isDirectedRelationship(r.type) ? esc(roleLabel(r, r.to)) : translate("ui.firstPerson")}</small><br><b>${esc(a.name)}</b></div><div><small>${isDirectedRelationship(r.type) ? esc(roleLabel(r, r.from)) : translate("ui.secondPerson")}</small><br><b>${esc(b.name)}</b></div></div><div class="pills"><span class="pill ${state === "official" ? "teal" : state === "conflict" ? "red" : state === "review" ? "review" : state === "requested" ? "blue" : "amber"}">${icon(state === "official" ? "fileCheck" : state === "missing" ? "fileMissing" : "book")}${labels[state]}</span></div></div><div class="profile-actions"><button class="btn small" data-edit-relation="${r.id}">${icon("edit")}${translate("ui.edit")}</button><button class="btn small primary" data-add-relation-doc="${r.id}">${icon("plus")}${translate("ui.source")}</button><button class="btn small" ${relationShown(r, false, true) ? "data-hide-graph-relation" : "data-reveal-graph-relation"}="${r.id}">${icon("sliders")}${relationShown(r, false, true) ? translate("ui.hideOnMap") : translate("ui.showOnMap")}</button></div><div class="panel-section"><div class="panel-title"><h3>${translate("ui.evidenceForThisRelationship")}</h3><small>${ds.length}</small></div>${ds.map(miniDoc).join("") || `<p class="kin-empty">${translate("ui.attachADocumentToThisSpecificRelationship")}</p>`}</div><p class="hint">${translate("ui.officialRecordsPhotosAndCorrespondenceHaveDifferentEvidential")}</p>${fields(recordValues(relationshipConfig(), r))}${r.notes ? `<div class="note-box">${esc(r.notes)}</div>` : ""}`;
  } else {
    const d = doc(appState.selected.id);
    if (d)
      html +=
        miniDoc(d) +
        `<button class="btn" data-document="${d.id}" style="margin-top:15px">${translate("ui.openSource")}</button>`;
  }
  $("#inspector").innerHTML = html;
}
