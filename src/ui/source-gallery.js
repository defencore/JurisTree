import { isMedia } from "../core/attachments.js";
import { esc } from "../core/dom.js";
import { bytes } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { objectUrl } from "../services/blobs.js";
import { icon } from "./icons.js";

export function sourceGallery(source, selectedId = "") {
  const file =
    source.attachments.find((file) => file.assetId === selectedId) ||
    source.attachments[0];
  const url = file && objectUrl(file.assetId);
  const preview = !url
    ? `<div class="file-placeholder">${icon("file")}<p>${translate(file ? "ui.documentAttachmentMissing" : "ui.noDigitalCopyAttachedYet")}</p></div>`
    : file.mime.startsWith("image/")
      ? `<a href="${url}" target="_blank" rel="noopener" class="image-preview-link" aria-label="${esc(translate("ui.openFullImage"))}"><img class="file-view" src="${url}" alt="${esc(file.caption || file.filename)}"></a>`
      : file.mime === "application/pdf"
        ? `<iframe class="pdf-view" src="${url}" title="${esc(file.filename)}"></iframe>`
        : isMedia(file.mime)
          ? `<${file.mime.startsWith("audio/") ? "audio" : "video"} class="media-view" controls preload="metadata" src="${url}" aria-label="${esc(file.filename)}"></${file.mime.startsWith("audio/") ? "audio" : "video"}>`
          : `<div class="file-placeholder">${icon("file")}<p>${translate("ui.fileAvailableToDownload")}</p></div>`;
  return `<div class="source-preview">${preview}</div>${file ? `<p class="gallery-caption"><b>${esc(file.caption || file.filename)}</b>${file.caption ? `<span>${esc(file.filename)}</span>` : ""}<span>${source.attachments.indexOf(file) + 1} / ${source.attachments.length} · ${bytes(file.size)}</span></p>${file.description ? `<p class="media-description">${esc(file.description)}</p>` : ""}${file.inscription ? `<blockquote class="media-inscription">${esc(file.inscription)}</blockquote>` : ""}<div class="gallery-actions"><button type="button" class="btn small" data-download-doc="${source.id}" data-attachment-id="${file.assetId}">${icon("download")}${translate("ui.downloadFile")}</button>${url && file.mime.startsWith("image/") ? `<button type="button" class="btn small" data-annotate-image="${source.id}" data-image-asset="${file.assetId}">${icon("edit")}${translate("ui.imageAnnotate")}</button><button type="button" class="btn small" data-crop-source="${source.id}" data-attachment-id="${file.assetId}">${icon("photo")}${translate("ui.cropCopy")}</button>` : ""}</div><div class="source-thumbnails" aria-label="${translate("ui.sourceAttachments")}">${source.attachments.map((item, index) => `<button type="button" class="source-thumbnail ${item.assetId === file.assetId ? "active" : ""}" data-show-attachment="${item.assetId}" aria-pressed="${item.assetId === file.assetId}" title="${esc([item.caption, item.filename].filter(Boolean).join(" · "))}" aria-label="${esc(item.caption || item.filename)}">${item.mime.startsWith("image/") && objectUrl(item.assetId) ? `<img src="${objectUrl(item.assetId)}" alt="" loading="lazy" decoding="async">` : icon("file")}<span>${index + 1}</span></button>`).join("")}</div>` : ""}<div class="attachment-controls"><button type="button" class="btn small" data-add-source-files="${source.id}">${icon("upload")}${translate("ui.addFiles")}</button><button type="button" class="btn small" data-paste-source="${source.id}">${icon("copy")}${translate("ui.pastePhotos")}</button></div>`;
}
