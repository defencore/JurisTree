import { attachmentExtensions } from "../core/attachments.js";
import { translate } from "../i18n/index.js";

export const MAX_SOURCE_FILES = 200;

// Normalize archived single-file records once; runtime records use attachments only.
export function normalizeSourceAttachments(source) {
  const input = Object.hasOwn(source, "attachments")
    ? source.attachments
    : source.assetId
      ? [
          {
            assetId: source.assetId,
            filename: source.filename,
            mime: source.mime,
            size: source.size,
          },
        ]
      : [];
  if (!Array.isArray(input) || input.length > MAX_SOURCE_FILES)
    throw Error(translate("ui.invalidAttachment"));
  const ids = new Set();
  return input.map((file) => {
    if (
      !file ||
      typeof file.assetId !== "string" ||
      !/^[\w-]{1,100}$/.test(file.assetId) ||
      ids.has(file.assetId)
    )
      throw Error(translate("ui.invalidAttachment"));
    ids.add(file.assetId);
    const mime = String(file.mime || "application/octet-stream");
    const size = Number(file.size || 0);
    if (
      !Object.hasOwn(attachmentExtensions, mime) ||
      !Number.isFinite(size) ||
      size < 0 ||
      size > 50 * 1048576
    )
      throw Error(translate("ui.invalidAttachment"));
    return {
      assetId: file.assetId,
      filename: String(file.filename || "").slice(0, 500),
      caption: String(file.caption || "").slice(0, 500),
      mime,
      size,
    };
  });
}

export function primaryAttachment(source) {
  return source.attachments[0];
}

export function attachmentSize(source) {
  return source.attachments.reduce((sum, file) => sum + file.size, 0);
}

export function projectAttachmentIds(project) {
  return new Set([
    ...project.people.map((person) => person.avatarId).filter(Boolean),
    ...project.documents.flatMap((source) =>
      source.attachments.map((file) => file.assetId),
    ),
  ]);
}
