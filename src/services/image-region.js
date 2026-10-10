import { imageDimensions } from "./attachment-files.js";
import { MAX_ATTACHMENT_BYTES } from "../core/config.js";
import { MAX_ATTACHMENT_FILES } from "../core/attachments.js";
import { projectAttachmentIds } from "../model/source-attachments.js";
import { translate } from "../i18n/index.js";

export function assertPortraitCapacity(project, files, portraits) {
  const ids = projectAttachmentIds({
    ...project,
    people: project.people.map((person) =>
      portraits.has(person.id) ? { ...person, avatarId: "" } : person,
    ),
  });
  const total =
    [...ids].reduce((sum, id) => sum + (files.get(id)?.size || 0), 0) +
    [...portraits.values()].reduce((sum, blob) => sum + blob.size, 0);
  if (
    ids.size + portraits.size > MAX_ATTACHMENT_FILES ||
    total > MAX_ATTACHMENT_BYTES
  )
    throw Error(translate("ui.attachmentLimitExceeded"));
}

/** Generate only a prepared portrait; the original remains owned by its library source. */
export async function regionPortrait(blob, rect) {
  const image = await imageDimensions(blob);
  const region = rect || { x: 0, y: 0, width: 1, height: 1 };
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 400;
  const context = canvas.getContext("2d");
  const width = image.naturalWidth * region.width,
    height = image.naturalHeight * region.height;
  const scale = Math.min(400 / width, 400 / height);
  context.drawImage(
    image,
    image.naturalWidth * region.x,
    image.naturalHeight * region.y,
    width,
    height,
    (400 - width * scale) / 2,
    (400 - height * scale) / 2,
    width * scale,
    height * scale,
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(Error(translate("ui.couldNotCompleteTheAction"))),
      "image/webp",
      0.92,
    ),
  );
}
