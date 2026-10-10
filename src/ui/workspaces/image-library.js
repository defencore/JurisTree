import { $, esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { translate as t } from "../../i18n/index.js";
import { mediaTargetLabel } from "../../model/image-regions.js";
import { icon } from "../icons.js";
import { mediaImage } from "../media-image.js";

export function libraryImages(project, query = "") {
  const search = query.trim().toLocaleLowerCase();
  return project.documents
    .flatMap((source) =>
      source.attachments
        .filter((file) => file.mime.startsWith("image/"))
        .map((file) => ({ source, file })),
    )
    .filter(({ source, file }) =>
      [
        source.title,
        source.repository,
        file.filename,
        file.caption,
        file.description,
        file.inscription,
        ...(file.regions || []).flatMap((region) => [
          region.title,
          region.notes,
          ...region.targets.map((target) => mediaTargetLabel(project, target)),
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
    );
}

export function renderImageLibrary() {
  const images = libraryImages(state.project, state.librarySearch);
  $("#otherView").innerHTML =
    `<div class="intro-line"><div><p>${t("ui.imageLibraryHint")}</p></div></div><div class="source-upload-bar"><button type="button" class="btn" data-paste-source>${icon("copy")}${t("ui.pastePhotos")}</button></div><div class="search media-library-search">${icon("search")}<input id="librarySearch" value="${esc(state.librarySearch)}" placeholder="${t("ui.imageTargetSearch")}" aria-label="${t("ui.imageLibrary")}"></div><div class="media-library-grid">${images.map(({ source, file }) => `<article class="media-library-card"><button type="button" class="media-library-preview" data-annotate-image="${source.id}" data-image-asset="${file.assetId}" aria-label="${esc(file.caption || source.title)}">${mediaImage(file)}</button><div class="media-library-body"><h3>${esc(file.caption || source.title)}</h3><small>${esc(file.filename)}</small>${file.description ? `<p>${esc(file.description)}</p>` : ""}${file.inscription ? `<blockquote>${esc(file.inscription)}</blockquote>` : ""}<span class="pill">${t("ui.imageAnnotationsCount", { count: file.regions?.length || 0 })}</span><div class="media-actions"><button type="button" class="btn small" data-annotate-image="${source.id}" data-image-asset="${file.assetId}">${icon("edit")}${t("ui.imageAnnotate")}</button><button type="button" class="btn small ghost" data-document="${source.id}">${icon("book")}${t("ui.openSource")}</button></div></div></article>`).join("")}</div>${images.length ? "" : `<div class="empty">${icon("photo")}<p>${t("ui.imageLibraryEmpty")}</p><button class="btn primary" data-action="add-document">${t("ui.addFile")}</button></div>`}`;
}
