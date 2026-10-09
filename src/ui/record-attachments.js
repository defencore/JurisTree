import { recordConfigs } from "../core/config.js";
import { esc } from "../core/dom.js";
import { translate } from "../i18n/index.js";
import { icon } from "./icons.js";

export function recordAttachmentsButton(personId, section, record) {
  if (
    !personId ||
    !record.id ||
    !recordConfigs()[section]?.fields.some(
      ([key, , type]) => key === "sourceId" && type === "source",
    )
  )
    return "";
  return `<div class="biography-record-actions"><button type="button" class="btn small" data-record-attachments="${esc(record.id)}" data-attachment-person="${esc(personId)}" data-attachment-section="${esc(section)}">${icon("paperclip")}${translate("ui.recordPhotosDocuments")}</button></div>`;
}
