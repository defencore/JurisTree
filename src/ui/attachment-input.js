import { translate } from "../i18n/index.js";
import { sourceFileAccept } from "../services/attachment-files.js";
import { icon } from "./icons.js";

export function attachmentInput({ portrait = false } = {}) {
  return `<section class="attachment-input" data-attachment-input><p class="field-caption">${icon(portrait ? "photo" : "paperclip")}${translate(portrait ? "ui.personProfilePhoto" : "ui.sourceAttachments")}</p><div class="attachment-controls"><button type="button" class="btn" data-choose-attachments>${icon("upload")}${translate("ui.chooseFiles")}</button><button type="button" class="btn" data-paste-images>${icon("copy")}${translate("ui.pastePhotos")}</button><input type="file" data-attachment-files accept="${portrait ? "image/jpeg,image/png,image/webp" : sourceFileAccept}" ${portrait ? "" : "multiple"} hidden></div><label class="field paste-field"><span>${translate("ui.pastePhotoHere")}</span><textarea data-image-paste rows="2" placeholder="${translate("ui.clipboardPasteHint")}" aria-label="${translate("ui.pastePhotoHere")}"></textarea></label><p class="hint">${translate(portrait ? "ui.portraitPasteHint" : "ui.sourceAttachmentsHint")}</p><p class="attachment-message hint" data-attachment-message role="status" aria-live="polite"></p>${portrait ? "" : '<div class="attachment-list" data-attachment-list></div>'}</section>`;
}
