import { esc } from "../../core/dom.js";
import { getLocale, translate } from "../../i18n/index.js";
import { icon } from "../icons.js";

export function renderMapViewsForm(views) {
  return `<p class="hint">${translate("ui.savedMapViewsHint")}</p><label class="field">${translate("ui.mapViewName")}<input name="map-view-name" maxlength="150" placeholder="${translate("ui.mapViewNameExample")}"></label><p class="hint">${translate("ui.savedMapViewsArchiveHint")}</p><section class="saved-map-views"><h3>${translate("ui.savedMapViews")}</h3>${views.length ? views.map((view) => `<article class="saved-map-view"><button type="button" class="map-view-restore" data-restore-view="${view.id}" aria-label="${esc(translate("ui.restoreNamedMapView", { name: view.name }))}">${icon("layout")}<span><b>${esc(view.name)}</b><small>${esc(new Date(view.savedAt).toLocaleString(getLocale(), { dateStyle: "medium", timeStyle: "short" }))}</small></span>${icon("rotate")}</button><button type="button" class="iconbtn" data-manage-view="${view.id}" aria-label="${esc(translate("ui.manageNamedMapView", { name: view.name }))}" title="${esc(translate("ui.manageNamedMapView", { name: view.name }))}">${icon("edit")}</button></article>`).join("") : `<p class="hint">${translate("ui.noSavedMapViews")}</p>`}</section>`;
}

export function renderMapViewEditForm(view) {
  return `<label class="field">${translate("ui.mapViewName")}<input name="map-view-name" value="${esc(view.name)}" maxlength="150" required></label><p class="hint">${translate("ui.updateMapViewHint")}</p><div class="map-view-edit-actions"><button type="button" class="btn" data-update-map-view>${icon("rotate")}${translate("ui.updateMapView")}</button><button type="button" class="btn danger" data-delete-map-view>${icon("trash")}${translate("ui.delete")}</button></div>`;
}
