import { dateInput } from "./date-input.js";
import { personDisplayName } from "../model/person-display.js";
import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { getLocale, translate as t } from "../i18n/index.js";
import { linkedDocs } from "../model/evidence.js";
import { person } from "../model/lookup.js";
import { analyzeProperty } from "../model/property-history.js";
import { propertyPeople } from "../model/property-records.js";
import { typeOptions } from "./components.js";
import { icon } from "./icons.js";
import {
  propertyHistoryView,
  propertySnapshotMarkup,
} from "./property-history.js";

export function allocationSummary(asset) {
  const total = (asset.allocations || []).reduce(
    (sum, row) => sum + Number(row.percent),
    0,
  );
  return `<details class="property-allocation"><summary>${t("ui.allocationPlan")}</summary><p class="hint">${t("ui.enterThePlannedSharesTheyDoNotEstablish")}</p>${(asset.allocations || []).map((row) => `<div class="allocation"><span>${esc(personDisplayName(person(row.personId)) || t("ui.personDeleted"))}</span><b>${esc(row.percent)}%</b></div>`).join("")}<div class="asset-total ${Math.abs(total - 100) > 0.001 ? "bad" : ""}"><span>${total > 100 ? t("ui.overallocated") : total < 100 ? t("ui.unallocated") : t("ui.allocated")}</span><b>${Math.abs(total - 100) > 0.001 ? Math.abs(100 - total).toFixed(2) + "%" : "100%"}</b></div></details>`;
}
export function propertySearchText(asset) {
  return [
    JSON.stringify(asset),
    ...[...propertyPeople(asset)].map((id) => person(id)?.name),
    ...linkedDocs("property", asset.id).map((document) =>
      JSON.stringify(document),
    ),
  ]
    .join(" ")
    .toLocaleLowerCase(getLocale());
}
function propertyCard(asset, date) {
  const analysis = analyzeProperty(asset, state.project, date);
  return `<article class="asset-card"><div class="asset-head"><span class="avatar">${icon("home")}</span><div><h3>${esc(asset.title)}</h3><p>${esc([asset.identifier, asset.country, asset.location].filter(Boolean).join(" · "))}</p><p>${asset.value !== "" && asset.value != null ? `${new Intl.NumberFormat(getLocale()).format(asset.value)} ${esc(asset.currency)}` : t("ui.noValuation")}</p></div><button class="btn small" data-edit-property="${asset.id}" aria-label="${esc(t("ui.editProperty") + " " + asset.title)}">${icon("edit")}</button></div>${(asset.rights || []).length ? propertySnapshotMarkup(asset, date) : `<p class="hint">${t("ui.propertyNoHistory")}${asset.ownerId ? ` · ${t("ui.propertyReferenceOwner")}: ${esc(person(asset.ownerId)?.name)}` : ""}</p>`}<div class="pills"><span class="pill">${t("ui.propertyRights")}: ${(asset.rights || []).length}</span><span class="pill">${t("ui.propertyTransfers")}: ${(asset.transfers || []).length}</span><span class="pill ${analysis.snapshot.claims.length ? "review" : ""}">${t("ui.propertyOpenClaims")}: ${analysis.snapshot.claims.length}</span></div><div class="property-card-actions"><button class="btn primary" data-property-history="${asset.id}">${icon("history")}${t("ui.propertyHistoryAnalysis")}</button><button class="btn small ghost" data-asset-doc="${asset.id}">${icon("file")}${t("ui.ownershipDocument")}${linkedDocs("property", asset.id).length})</button></div>${asset.allocations?.length ? allocationSummary(asset) : ""}${asset.notes ? `<p class="hint">${esc(asset.notes)}</p>` : ""}</article>`;
}

export function propertyWorkspace() {
  const date = state.propertyDate,
    focus = state.project.property.find((a) => a.id === state.propertyFocus);
  const toolbar = `<div class="property-controls ${focus ? "focused" : ""}"><label class="field">${t("ui.propertyAsOf")}${dateInput("", date, { id: "propertyDate" })}</label>${focus ? "" : `<div class="search">${icon("search")}<input id="propertySearch" value="${esc(state.propertySearch)}" placeholder="${t("ui.propertySearchHint")}" aria-label="${t("ui.propertySearchHint")}"></div><label class="field">${t("ui.filter")}<select id="propertyReviewFilter">${typeOptions({ all: t("ui.propertyAll"), claims: t("ui.propertyWithClaims"), review: t("ui.propertyNeedsReview") }, state.propertyReviewFilter)}</select></label>`}<div class="property-history-actions"><button class="iconbtn" data-property-command="undo" aria-label="${t("ui.undo")}" title="${t("ui.undoCtrlZ")}" ${state.history.length ? "" : "disabled"}>${icon("undo")}</button><button class="iconbtn" data-property-command="redo" aria-label="${t("ui.redo")}" title="${t("ui.redoCtrlShiftZ")}" ${state.future.length ? "" : "disabled"}>${icon("redo")}</button></div></div>`;
  if (focus)
    return (
      toolbar + propertyHistoryView(focus, date) + allocationSummary(focus)
    );
  const query = state.propertySearch
    .trim()
    .toLocaleLowerCase(getLocale())
    .split(/\s+/)
    .filter(Boolean);
  const items = state.project.property.filter((a) => {
    if (!query.every((word) => propertySearchText(a).includes(word)))
      return false;
    const { snapshot, issues } = analyzeProperty(a, state.project, date);
    return state.propertyReviewFilter === "claims"
      ? snapshot.claims.length
      : state.propertyReviewFilter === "review"
        ? issues.length
        : true;
  });
  return `<div class="intro-line"><div><h2>${t("ui.propertyHistoryAnalysis")}</h2><p>${t("ui.propertyWorkspaceHint")}</p></div></div>${toolbar}${items.map((asset) => propertyCard(asset, date)).join("") || `<div class="empty">${icon("home")}<h2>${t(state.project.property.length ? "ui.propertyNoMatches" : "ui.addFamilyProperty")}</h2><button class="btn primary" data-action="add-property">${t("ui.addProperty")}</button></div>`}`;
}
