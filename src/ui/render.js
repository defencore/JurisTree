import { getLocale } from "../i18n/index.js";
import { relTypes } from "../core/config.js";
import { $, $$, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { renderDocuments, renderGaps } from "../features/documents.js";
import { familyEvents, renderEvents } from "../features/events.js";
import { kinGroups, renderGroups } from "../features/groups.js";
import { profileScope, renderPersonDetails } from "../features/profiles.js";
import { renderProperty } from "../features/property.js";
import { relationShown, resetAnalysis } from "../graph/analysis.js";
import { renderGraphControls } from "../graph/controls.js";
import { renderGraph, roleLabel } from "../graph/render.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import {
  edgeState,
  gaps,
  hasFile,
  linkedDocs,
  requirements,
  route,
  sourceInScope,
} from "../model/evidence.js";
import {
  doc,
  group,
  person,
  relation,
  withProjectIndex,
} from "../model/project.js";
import { scheduleSave } from "../services/storage.js";
import {
  avatar,
  biographyButton,
  miniDoc,
  personOptions,
  requirementCard,
} from "./components.js";
import { icon, icons } from "./icons.js";
export function render() {
  if (!appState.project) return;
  return withProjectIndex(renderAll);
}
export function renderAll() {
  $("#projectTitle").textContent = appState.project.title;
  $("#demoTag").hidden = !appState.project.demo;
  $("#purpose").value = appState.project.purpose;
  $("#peopleCount").textContent = appState.project.people.length;
  $("#docCount").textContent =
    appState.project.documents.filter(sourceInScope).length;
  $("#gapCount").textContent = gaps().length;
  $("#assetCount").textContent = appState.project.property.length;
  $("#eventCount").textContent = familyEvents().length;
  $$("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === appState.view);
    if (b.dataset.view === appState.view)
      b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("view-full", appState.view !== "tree");
  renderGroups();
  renderPeople();
  renderMain();
  renderInspector();
  renderStatusBoard();
  icons();
}
export function renderPeople() {
  if (!appState.project) return;
  return withProjectIndex(renderPeopleAll);
}
export function renderPeopleAll() {
  const q = $("#peopleSearch").value.toLocaleLowerCase(getLocale());
  const ps = appState.project.people.filter(
    (p) =>
      (!appState.groupFilter ||
        (p.groupIds || []).includes(appState.groupFilter)) &&
      (p.name + " " + (p.aliases || ""))
        .toLocaleLowerCase(getLocale())
        .includes(q),
  );
  $("#personList").innerHTML =
    ps
      .map((p) => {
        const missing = requirements(p).filter((t) => !t.done).length,
          dates = years(p),
          status = missing
            ? `${translate("ui.missingDocuments")} ` + missing
            : translate("ui.documentsCollected");
        return `<div class="person-row ${appState.selected?.kind === "person" && appState.selected.id === p.id ? "selected" : ""}"><button type="button" class="person-select" data-person="${p.id}" aria-label="${esc(p.name + (dates ? ", " + dates : "") + ". " + status)}" ${appState.selected?.kind === "person" && appState.selected.id === p.id ? 'aria-current="true"' : ""}>${avatar(p)}<span class="person-row-text"><b>${esc(p.name)}</b><small>${esc(dates)}</small></span><span class="row-state ${missing ? "" : "ready"}" title="${status}">${icon(missing ? "fileMissing" : "fileCheck")}${missing ? `<span>${missing}</span>` : ""}</span></button>${biographyButton(p, true)}</div>`;
      })
      .join("") ||
    `<p class="hint">${q ? translate("ui.noPeopleMatchThisSearch") : translate("ui.noPeopleYetAddTheFirstPerson")}</p>`;
}
export function renderMain() {
  const titles = {
      tree: translate("ui.relationshipMap"),
      documents: translate("ui.documentsAndSources"),
      gaps: translate("ui.evidenceAndGaps"),
      property: translate("ui.propertyAndShares"),
      events: translate("ui.eventsAndAnniversaries"),
    },
    eyebrows = {
      tree: translate("ui.familyRelationships"),
      documents: translate("ui.documentsPhotosRecords"),
      gaps: translate("ui.nextSteps"),
      property: translate("ui.ownershipAndAllocationPlan"),
      events: translate("ui.familyTimeline"),
    };
  $("#viewTitle").textContent = titles[appState.view];
  $("#viewEyebrow").textContent = eyebrows[appState.view];
  $("#viewSubtitle").textContent = appState.project.demo
    ? translate("ui.demoTreeFictionalData")
    : appState.project.title;
  $("#canvasWrap").hidden = appState.view !== "tree";
  $("#statusBoard").hidden = appState.view === "events";
  $("#otherView").hidden = appState.view === "tree";
  $("#viewActions").innerHTML =
    appState.view === "tree"
      ? `<button class="btn" data-action="compare" title="${translate("ui.howAreWeRelated")}">${icon("compare")}<span>${translate("ui.kinship")}</span></button><button class="btn" data-action="add-relation" title="${translate("ui.addRelationship")}">${icon("link")}<span>${translate("ui.relationship")}</span></button><button class="btn primary" data-action="add-person" title="${translate("ui.addPerson")}">${icon("addPerson")}<span>${translate("ui.addPerson")}</span></button>${appState.comparisonPath ? `<button class="iconbtn" data-action="clear-comparison" title="${translate("ui.clearPathHighlight")}" aria-label="${translate("ui.clearPathHighlight")}">${icon("x")}</button>` : ""}`
      : appState.view === "events"
        ? profileScope().includes("timeline")
          ? `<button class="btn primary" data-action="add-event">${icon("plus")}${translate("ui.addEvent")}</button>`
          : `<button class="btn" data-action="scope">${icon("sliders")}${translate("ui.configureSections")}</button>`
        : appState.view === "property"
          ? `<button class="btn primary" data-action="add-property">${icon("plus")}<span>${translate("ui.addProperty")}</span></button>`
          : `<button class="btn" data-action="reference" title="${translate("ui.addARecordWithoutAFile")}">${icon("reference")}<span>${translate("ui.recordWithoutAFile")}</span></button><button class="btn primary" data-action="add-document" title="${translate("ui.addFile")}">${icon("upload")}<span>${translate("ui.addFile")}</span></button>`;
  const path = route();
  $("#pathPanel").innerHTML =
    appState.view === "tree" && appState.project.purpose === "inheritance"
      ? `<div class="path-panel">${icon("route")}<span class="label">${translate("ui.owner")}</span><select id="subjectSelect" aria-label="${translate("ui.deceasedEstateOwner")}">${personOptions(appState.project.subjectId, true)}</select><span class="label">${translate("ui.claimant")}</span><select id="claimantSelect" aria-label="${translate("ui.claimant")}">${personOptions(appState.project.claimantId, true)}</select><span class="path-summary">${path.found ? icon("link") + " " + path.relations.length + ` ${translate("ui.familyRelationships2")}` : translate("ui.noRouteFound")}</span></div>`
      : "";
  renderGraphControls();
  if (appState.view === "tree") {
    renderGraph();
    return;
  }
  if (appState.view === "events") renderEvents();
  else if (appState.view === "documents") renderDocuments();
  else if (appState.view === "gaps") renderGaps();
  else renderProperty();
}
export function renderInspector() {
  let html = `<div class="inspector-header"><b>${translate("ui.personDetails")}</b><button class="iconbtn mobile-only" data-action="close-panel" aria-label="${translate("ui.closeDetails")}">${icon("panelClose")}</button></div>`;
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
    html += `<div class="profile"><div class="profile-top">${avatar(p)}<div><h2>${esc(p.name)}</h2><p>${esc(years(p))}${p.place ? "<br>" + esc(p.place) : ""}</p></div></div><div class="pills"><span class="pill ${done === req.length ? "teal" : "amber"}">${icon(done === req.length ? "fileCheck" : "fileMissing")}${done} / ${req.length} ${translate("ui.documentsAvailable")}</span>${(
      p.groupIds || []
    )
      .map(group)
      .filter(Boolean)
      .map((g) => `<span class="pill">${esc(g.name)}</span>`)
      .join(
        "",
      )}${p.id === appState.project.subjectId ? `<span class="pill blue">${icon("fingerprint")}${translate("ui.ownerDeceasedEstateOwner")}</span>` : ""}${p.id === appState.project.claimantId ? `<span class="pill teal">${icon("user")}${translate("ui.claimant")}</span>` : ""}</div></div><div class="profile-actions"><button class="btn small" data-edit-person="${p.id}">${icon("edit")}${translate("ui.edit")}</button><button class="btn small" data-portrait="${p.id}">${icon("photo")}${translate("ui.photo")}</button></div><button class="btn compare-profile" data-action="compare">${icon("compare")}${translate("ui.howAreWeRelated")}</button>${biographyButton(p)}${kinGroups(p)}<div class="panel-section"><div class="panel-title"><h3>${translate("ui.requiredDocuments")}</h3><small>${done} / ${req.length} ${translate("ui.available2")}</small></div><div class="progress"><i style="width:${req.length ? (done / req.length) * 100 : 100}%"></i></div>${req.map((t) => requirementCard(p, t)).join("") || `<p class="hint">${translate("ui.configureTheChecklistInThePersonProfile")}</p>`}</div><div class="panel-section"><div class="panel-title"><h3>${translate("ui.sourcesForThisPerson")}</h3><button class="btn small ghost" data-add-for="${p.id}">${icon("plus")}${translate("ui.add")}</button></div>${ds.map(miniDoc).join("") || `<p class="kin-empty">${translate("ui.noCertificatesPhotosOrArchiveRecordsAddedYet")}</p>`}</div>${renderPersonDetails(p)}${p.aliases ? `<div class="panel-section"><div class="panel-title"><h3>${translate("ui.otherNames")}</h3></div><div class="note-box">${esc(p.aliases)}</div></div>` : ""}${p.notes ? `<div class="panel-section"><div class="panel-title"><h3>${translate("ui.notes")}</h3></div><div class="note-box">${esc(p.notes)}</div></div>` : ""}`;
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
    html = `<div class="inspector-header"><b>${translate("ui.relationshipDetails")}</b><button class="iconbtn mobile-only" data-action="close-panel" aria-label="${translate("ui.closeDetails")}">${icon("panelClose")}</button></div><div class="profile"><h2>${esc(relTypes()[r.type])}</h2><div class="rel-direction"><div><small>${["parent", "adopted"].includes(r.type) ? esc(roleLabel(r, r.to)) : translate("ui.firstPerson")}</small><br><b>${esc(a.name)}</b></div><div><small>${["parent", "adopted"].includes(r.type) ? esc(roleLabel(r, r.from)) : translate("ui.secondPerson")}</small><br><b>${esc(b.name)}</b></div></div><div class="pills"><span class="pill ${state === "official" ? "teal" : state === "conflict" ? "red" : state === "review" ? "review" : state === "requested" ? "blue" : "amber"}">${icon(state === "official" ? "fileCheck" : state === "missing" ? "fileMissing" : "book")}${labels[state]}</span></div></div><div class="profile-actions"><button class="btn small" data-edit-relation="${r.id}">${icon("edit")}${translate("ui.edit")}</button><button class="btn small primary" data-add-relation-doc="${r.id}">${icon("plus")}${translate("ui.source")}</button><button class="btn small" ${relationShown(r, false, true) ? "data-hide-graph-relation" : "data-reveal-graph-relation"}="${r.id}">${icon("sliders")}${relationShown(r, false, true) ? translate("ui.hideOnMap") : translate("ui.showOnMap")}</button></div><div class="panel-section"><div class="panel-title"><h3>${translate("ui.evidenceForThisRelationship")}</h3><small>${ds.length}</small></div>${ds.map(miniDoc).join("") || `<p class="kin-empty">${translate("ui.attachADocumentToThisSpecificRelationship")}</p>`}</div><p class="hint">${translate("ui.officialRecordsPhotosAndCorrespondenceHaveDifferentEvidential")}</p>${r.notes ? `<div class="note-box">${esc(r.notes)}</div>` : ""}`;
  } else {
    const d = doc(appState.selected.id);
    if (d)
      html +=
        miniDoc(d) +
        `<button class="btn" data-document="${d.id}" style="margin-top:15px">${translate("ui.openSource")}</button>`;
  }
  $("#inspector").innerHTML = html;
}
export function select(kind, id) {
  if (
    appState.graphFocus &&
    kind === "person" &&
    !appState.graphFocus.people.includes(id)
  )
    resetAnalysis(false);
  appState.multiSelection.clear();
  appState.comparisonPath = null;
  let scopeChanged = false;
  if (kind === "person") {
    const p = person(id);
    if (
      appState.groupFilter &&
      !(p.groupIds || []).includes(appState.groupFilter)
    ) {
      appState.groupFilter = "";
      scopeChanged = true;
    }
    for (const g of appState.project.groups)
      if (g.collapsed && (p.groupIds || []).includes(g.id)) {
        g.collapsed = false;
        scopeChanged = true;
        scheduleSave();
      }
  }
  appState.selected = {
    kind,
    id,
  };
  if (appState.view !== "tree" || scopeChanged) {
    appState.view = "tree";
    render();
  } else {
    renderPeople();
    renderGraph();
    renderInspector();
    icons();
  }
  $("#inspector").classList.add("open");
  if (innerWidth < 670) $("#sidebar").classList.remove("open");
}
export function renderStatusBoard() {
  const ds = appState.project.documents.filter(sourceInScope),
    present = ds.filter((d) => d.status === "available").length,
    review = ds.filter(
      (d) =>
        d.status === "needs_review" ||
        (d.status === "available" && d.evidence === "unverified"),
    ).length,
    files = ds.filter(hasFile).length;
  $("#statusBoard").innerHTML = [
    [
      "available",
      present,
      translate("ui.documentsAvailable2"),
      "fileCheck",
      "available",
    ],
    [
      "missing",
      gaps().length,
      translate("ui.evidenceMissing2"),
      "fileMissing",
      "gaps",
    ],
    ["review", review, translate("ui.review2"), "search", "review"],
    [
      "neutral",
      files + "/" + ds.length,
      translate("ui.filesAttached"),
      "paperclip",
      "files",
    ],
  ]
    .map(
      ([tone, count, label, ic, filter]) =>
        `<button class="status-tile" data-overview="${filter}"><span class="tile-icon tone-${tone}">${icon(ic)}</span><span><b>${count}</b><small>${label}</small></span></button>`,
    )
    .join("");
}
