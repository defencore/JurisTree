import { attachmentExtensions } from "../core/attachments.js";
import { translate } from "../i18n/index.js";

export const clipboardImageTypes = ["image/png", "image/jpeg", "image/webp"];

export function pastedImages(event) {
  const data = event.clipboardData;
  if (!data) return [];
  const files = data.files.length
    ? [...data.files]
    : [...data.items]
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile());
  return files.filter(
    (file) => file && clipboardImageTypes.includes(file.type),
  );
}

export async function readClipboardImages() {
  if (!globalThis.navigator?.clipboard?.read)
    throw Error(translate("ui.clipboardPasteFallback"));
  let items;
  try {
    items = await navigator.clipboard.read();
  } catch {
    throw Error(translate("ui.clipboardPasteFallback"));
  }
  const files = [];
  for (const item of items) {
    const mime = clipboardImageTypes.find((type) => item.types.includes(type));
    if (!mime) continue;
    const blob = await item.getType(mime);
    files.push(
      new File(
        [blob],
        `Clipboard-${Date.now()}-${files.length + 1}.${attachmentExtensions[mime]}`,
        { type: mime },
      ),
    );
  }
  if (!files.length) throw Error(translate("ui.clipboardNoImage"));
  return files;
}
