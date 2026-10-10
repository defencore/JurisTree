import { attachmentExtensions, mediaMime } from "../core/attachments.js";
import { translate } from "../i18n/index.js";

export const sourceFileAccept =
  ".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.mov";

export function attachmentMime(file) {
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return file.type;
  const ext = file.name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "pdf", "txt", "docx"].includes(ext))
    return Object.keys(attachmentExtensions).find(
      (type) => attachmentExtensions[type] === (ext === "jpeg" ? "jpg" : ext),
    );
  return mediaMime(file);
}

export async function imageDimensions(blob) {
  const image = new Image(),
    url = URL.createObjectURL(blob);
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(Error(translate("ui.unsupportedOrDamagedImage")));
      image.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 90e6)
      throw Error(translate("ui.imageTooLargeToProcess"));
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareAttachment(file) {
  const mime = attachmentMime(file);
  if (!mime) throw Error(translate("ui.attachmentFormats"));
  if (file.size > 50 * 1048576)
    throw Error(file.name + translate("ui.fileExceeds50MbReduceItsSizeBefore"));
  if (mime === "application/pdf" && file.size > 12 * 1048576)
    throw Error(translate("ui.pdfAttachmentSizeLimit"));
  if (
    [
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(mime) &&
    file.size > 5 * 1048576
  )
    throw Error(translate("ui.textDocumentsMustBeUnder5Mb"));
  if (/^(audio|video)\//.test(mime) && file.size > 20 * 1048576)
    throw Error(translate("ui.recordingLimit"));
  const blob = file.type === mime ? file : new Blob([file], { type: mime });
  const image = mime.startsWith("image/") ? await imageDimensions(blob) : null;
  return {
    blob,
    filename: file.name,
    mime,
    size: blob.size,
    ...(image
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : {}),
  };
}
