import { MAX_ATTACHMENT_FILES } from "../core/attachments.js";
import { MAX_ATTACHMENT_BYTES } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { download, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { storageTotal } from "../model/evidence.js";
import { doc } from "../model/lookup.js";
import {
  MAX_SOURCE_FILES,
  projectAttachmentIds,
} from "../model/source-attachments.js";
import { commit } from "../services/history.js";
import { cropImage } from "../ui/cropper.js";
import { viewDocument } from "./document-view.js";
import { editDocument } from "./documents.js";

export function openFiles(context = {}) {
  appState.fileContext = context;
  $("#fileInput").value = "";
  $("#fileInput").click();
}

export async function processFiles(files, context = {}) {
  if (files.length)
    await editDocument(context.documentId || null, files, context);
}

export function downloadAttachment(sourceId, attachmentId) {
  const source = doc(sourceId);
  const file =
    source?.attachments.find((file) => file.assetId === attachmentId) ||
    source?.attachments[0];
  if (file && appState.blobs.has(file.assetId))
    download(appState.blobs.get(file.assetId), file.filename || source.title);
}

export async function cropSourceCopy(sourceId, attachmentId) {
  const source = doc(sourceId),
    original = source?.attachments.find(
      (file) => file.assetId === attachmentId,
    );
  if (!original || !appState.blobs.has(original.assetId)) return;
  if (source.attachments.length >= MAX_SOURCE_FILES)
    throw Error(
      translate("ui.sourceAttachmentLimit", { limit: MAX_SOURCE_FILES }),
    );
  if (projectAttachmentIds(appState.project).size >= MAX_ATTACHMENT_FILES)
    throw Error(
      translate("ui.projectAttachmentLimit", { limit: MAX_ATTACHMENT_FILES }),
    );
  const blob = await cropImage(appState.blobs.get(original.assetId), false);
  if (!blob) return;
  if (storageTotal() + blob.size > MAX_ATTACHMENT_BYTES)
    throw Error(translate("ui.attachmentLimitExceeded"));
  const assetId = uid();
  commit(() => {
    appState.blobs.set(assetId, blob);
    source.attachments.push({
      assetId,
      filename: original.filename.replace(/\.[^.]*$/, "") + "-copy.webp",
      mime: blob.type,
      size: blob.size,
    });
  });
  await viewDocument(sourceId);
}
