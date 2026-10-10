import { checkZip } from "../services/zip-validation.js";
import { attachmentExtensions } from "../core/attachments.js";
import { archiveFilename } from "../core/archive-filename.js";
import {
  graphStateInfo,
  MAX_ATTACHMENT_BYTES,
  relTypes,
} from "../core/config.js";
import { $, $$, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone, download, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { graphView } from "../model/graph-view.js";
import { validateImport } from "../model/validation.js";
import { usedBlobs } from "../services/blobs.js";
import { saveNow } from "../services/storage.js";
import { openDialog, toast } from "../ui/dialog.js";
import { renderExportForm } from "../ui/forms/export.js";
import { renderStart } from "../ui/start.js";
import JSZip from "../vendor/zip.js";
import { activateTree, confirmStartReplacement } from "./workspace-session.js";

export async function exportArchive(
  model = appState.project,
  files = appState.blobs,
) {
  const btns = $$("[data-export]");
  btns.forEach((b) => (b.disabled = true));
  try {
    const exportedAt = new Date(),
      zip = new JSZip(),
      manifest = clone(model);
    manifest.exportedAt = exportedAt.toISOString();
    manifest.attachments = {};
    for (const id of usedBlobs(model, files)) {
      const blob = files.get(id),
        ext = attachmentExtensions[blob.type] || "bin",
        path = "attachments/" + id + "." + ext;
      manifest.attachments[id] = {
        path,
        mime: blob.type,
        size: blob.size,
      };
      zip.file(path, await blob.arrayBuffer());
    }
    const treeText = JSON.stringify(manifest, null, 2);
    if (new Blob([treeText]).size > 16 * 1048576)
      throw Error(translate("ui.treeDescriptionExceeds16MbShortenLongTexts"));
    zip.file("tree.json", treeText);
    zip.file(
      "README.txt",
      `JurisTree — portable archive

Open JurisTree, choose Import and select this ZIP file.
The archive contains tree.json and all attached files.
Source attachments retain their original contents. Cropped images are additional copies.
Portraits are prepared copies.
Property shares are a user plan, not a legal determination.
`,
    );
    const blob = await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      },
      (m) => {
        const el = $("#exportProgress");
        if (el)
          el.textContent =
            `${translate("ui.archive")} ` + Math.round(m.percent) + "%";
      },
    );
    download(blob, archiveFilename(model.title, exportedAt));
    toast(translate("ui.theArchiveContainsTheTreeAndAllAttachments"));
    if (model === appState.project && appState.editorActive) await saveNow();
  } catch (e) {
    toast(`${translate("ui.couldNotCreateArchive")} ` + e.message, true);
  } finally {
    btns.forEach((b) => (b.disabled = false));
  }
}

export async function importFile(file, { fromStart = false } = {}) {
  if (fromStart && (!appState.initialized || appState.startBusy)) return false;
  if (fromStart) {
    appState.startBusy = true;
    $("#startError").textContent = "";
    renderStart();
    $("#startStorageNote").textContent = translate(
      "ui.readingAndValidatingFile",
    );
  }
  try {
    if (!/\.(zip|json)$/i.test(file.name))
      throw Error(translate("ui.chooseAJuristreeZipArchiveOrJsonFile"));
    if (file.size > 110 * 1048576)
      throw Error(translate("ui.archiveMustBeUnder110Mb"));
    let raw,
      files = new Map(),
      unpackedBytes = 0;
    if (/\.json$/i.test(file.name)) {
      if (file.size > 16 * 1048576)
        throw Error(translate("ui.jsonFileTooLarge"));
      raw = JSON.parse(await file.text());
    } else {
      const buf = await file.arrayBuffer();
      checkZip(buf);
      const zip = await JSZip.loadAsync(buf, {
          checkCRC32: true,
        }),
        manifest = zip.file("tree.json");
      if (!manifest) throw Error(translate("ui.archiveDoesNotContainTreeJson"));
      const text = await manifest.async("string");
      if (text.length > 16 * 1048576)
        throw Error(translate("ui.treeDescriptionTooLarge"));
      raw = JSON.parse(text);
      for (const [id, a] of Object.entries(raw.attachments || {})) {
        if (
          !/^[\w-]{1,100}$/.test(id) ||
          typeof a.path !== "string" ||
          !a.path.startsWith("attachments/") ||
          a.path.includes("..")
        )
          throw Error(translate("ui.invalidAttachment"));
        const z = zip.file(a.path);
        if (!z)
          throw Error(`${translate("ui.archiveIsMissingFile")} ` + a.path);
        const mime = String(a.mime || "application/octet-stream");
        if (!Object.hasOwn(attachmentExtensions, mime))
          throw Error(translate("ui.unsupportedAttachmentType"));
        const content = await z.async("uint8array");
        unpackedBytes += content.byteLength;
        if (unpackedBytes > MAX_ATTACHMENT_BYTES)
          throw Error(translate("ui.attachmentsExceed100Mb"));
        files.set(
          id,
          new Blob([content], {
            type: mime,
          }),
        );
      }
    }
    const imported = validateImport(raw);
    for (const p of imported.people)
      if (
        p.avatarId &&
        (!files.has(p.avatarId) ||
          !files.get(p.avatarId).type.startsWith("image/"))
      )
        throw Error(translate("ui.personPhotoMissing"));
    for (const d of imported.documents)
      for (const file of d.attachments) {
        if (!files.has(file.assetId))
          throw Error(translate("ui.documentAttachmentMissing"));
        file.mime = files.get(file.assetId).type;
        file.size = files.get(file.assetId).size;
      }
    for (const [id, blob] of [...files])
      if (appState.blobs.has(id)) {
        const newId = uid();
        files.set(newId, blob);
        files.delete(id);
        imported.people.forEach((p) => {
          if (p.avatarId === id) p.avatarId = newId;
        });
        imported.documents.forEach((d) => {
          d.attachments.forEach((file) => {
            if (file.assetId === id) file.assetId = newId;
          });
        });
      }
    const summary = `<div class="upload-info"><b>${esc(imported.title)}</b><br>${imported.people.length} ${translate("ui.people")} ${imported.relations.length} ${translate("ui.relationships2")} ${imported.documents.length} ${translate("ui.sources")}</div>`;
    const confirmed = fromStart
      ? await confirmStartReplacement(summary)
      : !!(await openDialog(
          translate("ui.importTree"),
          `${summary}<p class="hint">${translate("ui.theCurrentDraftWillBeReplacedExportIt")}</p><button type="button" class="btn" data-export="zip">${translate("ui.saveCurrentTree")}</button>`,
          {
            submit: translate("ui.import"),
          },
        ));
    if (!confirmed) return false;
    activateTree(imported, files);
    await saveNow();
    toast(translate("ui.treeAndAttachmentsImportedYouCanContinueEditing"));
    return true;
  } catch (e) {
    const message = `${translate("ui.importFailed")} ` + e.message;
    if (fromStart) $("#startError").textContent = message;
    toast(message, true);
    return false;
  } finally {
    if (fromStart) {
      appState.startBusy = false;
      renderStart();
    }
  }
}

export function exportDialog() {
  const filtered =
    appState.directConnectionRoot ||
    appState.groupFilter ||
    appState.graphFocus ||
    graphView().types.length < Object.keys(relTypes()).length ||
    graphView().states.length < Object.keys(graphStateInfo()).length ||
    graphView().hiddenRelations.length;
  openDialog(translate("ui.exportTree"), renderExportForm(filtered), {
    footer: false,
  });
}
