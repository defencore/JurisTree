import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import { windowControls } from "./floating-windows.js";
import { icon } from "./icons.js";

export function imageRegionEditor(file, url) {
  return `<form method="dialog" class="media-editor-form"><header class="media-editor-header modal-head"><div><h2>${t("ui.imageAnnotations")}</h2><p>${esc(file.filename)}</p></div>${windowControls()}<button type="button" class="iconbtn" data-media-close aria-label="${t("ui.close")}">${icon("x")}</button></header><div class="media-editor-layout"><section class="media-editor-image"><div class="media-editor-toolbar"><button type="button" class="btn small" data-media-draw>${icon("plus")}${t("ui.imageDrawRegion")}</button><button type="button" class="btn small" data-media-whole>${t("ui.imageWhole")}</button><label><input type="checkbox" data-media-marks checked> ${t("ui.imageHideMarks")}</label><label class="media-zoom">${t("ui.imageZoom")}<input type="range" min="0.5" max="4" step="0.1" value="1" data-media-zoom><output data-media-zoom-value>100%</output></label></div><p class="hint" data-media-hint>${t("ui.imageSelectHint")}</p><div class="media-image-viewport"><div class="media-image-stage"><img src="${url}" width="${file.width}" height="${file.height}" alt="${esc(file.caption || file.filename)}" draggable="false"><div class="media-region-overlay"></div></div></div></section><aside class="media-editor-details"><label class="field">${t("ui.attachmentCaption")}<input data-media-caption maxlength="500" value="${esc(file.caption || "")}"></label><label class="field">${t("ui.imageDescription")}<textarea data-media-description rows="3" maxlength="15000" placeholder="${t("ui.imageDescriptionHint")}">${esc(file.description || "")}</textarea></label><label class="field">${t("ui.imageInscription")}<textarea data-media-inscription rows="3" maxlength="15000" placeholder="${t("ui.imageInscriptionHint")}">${esc(file.inscription || "")}</textarea></label><div class="media-annotation-list" data-media-list></div><div data-media-region-details hidden><label class="field">${t("ui.imageRegionTitle")}<input data-media-title maxlength="500"></label><label class="field">${t("ui.notes")}<textarea data-media-notes rows="2" maxlength="5000"></textarea></label><fieldset class="media-coordinates"><legend>${t("ui.imagePosition")}</legend>${[
    ["x", "X"],
    ["y", "Y"],
    ["width", t("ui.imageWidth")],
    ["height", t("ui.imageHeight")],
  ]
    .map(
      ([key, label]) =>
        `<label>${label}<input type="number" min="0" max="100" step="any" data-media-coordinate="${key}" aria-label="${label}"></label>`,
    )
    .join(
      "",
    )}</fieldset><p class="field-caption">${t("ui.imageLinkedTo")}</p><div data-media-links></div><label class="field">${t("ui.search")}<input data-media-search placeholder="${t("ui.imageTargetSearch")}"></label><label class="field">${t("ui.imageLinkedTo")}<select data-media-target></select></label><button type="button" class="btn small" data-media-add-link>${t("ui.imageAddLink")}</button><div class="media-portrait-controls"><label class="field">${t("ui.imagePortraitPerson")}<select data-media-portrait-person></select></label><button type="button" class="btn small" data-media-portrait>${t("ui.imageSetPortrait")}</button></div><button type="button" class="btn small danger" data-media-delete>${t("ui.imageRemoveRegion")}</button></div></aside></div><footer class="media-editor-footer"><p role="status" data-media-message></p><button type="button" class="btn" data-media-close>${t("ui.cancel")}</button><button type="submit" class="btn primary">${t("ui.save")}</button></footer></form>`;
}
