import { mediaMime } from "../core/attachments.js";
import { MAX_ATTACHMENT_BYTES } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { storageTotal } from "../model/evidence.js";
import { doc, person } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { cropImage } from "../ui/cropper.js";
import { toast } from "../ui/dialog.js";
import { editDocument } from "./documents.js";

export function openFiles(context = {}) {
  appState.fileContext = context;
  $("#fileInput").value = "";
  $("#fileInput").click();
}
export async function processFiles(files, context = {}) {
  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      toast(
        file.name + translate("ui.fileExceeds50MbReduceItsSizeBefore"),
        true,
      );
      continue;
    }
    try {
      let blob = file,
        mime = file.type;
      if (["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        blob = await cropImage(file, false);
        if (!blob) continue;
        mime = blob.type;
      } else if (mime === "application/pdf" || /\.pdf$/i.test(file.name)) {
        mime = "application/pdf";
        if (file.size > 12 * 1024 * 1024) {
          toast(translate("ui.pdfsMustBeUnder12MbAddLarge"), true);
          continue;
        }
      } else if (/\.(txt|docx)$/i.test(file.name)) {
        if (file.size > 5 * 1024 * 1024) {
          toast(translate("ui.textDocumentsMustBeUnder5Mb"), true);
          continue;
        }
        mime = /\.txt$/i.test(file.name)
          ? "text/plain"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (mediaMime(file)) {
        mime = mediaMime(file);
        if (file.size > 20 * 1024 * 1024) {
          toast(translate("ui.recordingLimit"), true);
          continue;
        }
      } else {
        toast(translate("ui.attachmentFormats"), true);
        continue;
      }
      if (blob.type !== mime) blob = new Blob([blob], { type: mime });
      const current = context.documentId ? doc(context.documentId) : null;
      const reusable =
        current?.assetId &&
        !appState.project.documents.some(
          (d) => d.id !== current.id && d.assetId === current.assetId,
        ) &&
        !appState.project.people.some((p) => p.avatarId === current.assetId)
          ? appState.blobs.get(current.assetId)?.size || 0
          : 0;
      if (storageTotal() - reusable + blob.size > MAX_ATTACHMENT_BYTES) {
        toast(
          translate("ui.attachmentsAreApproaching100MbSaveAnArchive"),
          true,
        );
        continue;
      }
      await editDocument(
        context.documentId || null,
        {
          name: file.name.replace(
            /\.(jpg|jpeg|png|webp)$/i,
            blob.type === "image/webp" ? ".webp" : ".jpg",
          ),
          mime,
          blob,
          originalSize: file.size,
        },
        context,
      );
    } catch (e) {
      toast(
        `${translate("ui.couldNotRead")} ` + file.name + ". " + e.message,
        true,
      );
    }
  }
}
export async function setPortrait(id, file) {
  try {
    const blob = await cropImage(file, true);
    if (!blob) return;
    if (storageTotal() + blob.size > MAX_ATTACHMENT_BYTES)
      throw Error(translate("ui.attachmentLimitExceeded"));
    commit(() => {
      const aid = uid();
      appState.blobs.set(aid, blob);
      person(id).avatarId = aid;
    });
  } catch (e) {
    toast(e.message, true);
  }
}
