import { attachmentExtensions } from "../core/attachments.js";
import {
  graphStateInfo,
  MAX_ATTACHMENT_BYTES,
  relTypes,
} from "../core/config.js";
import { $, $$, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone, dataUrl, download, safeName, uid } from "../core/utils.js";
import { bounds } from "../graph/camera.js";
import { exportLineLegend } from "../graph/legend.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import { graphDefs, renderFilteredGraph } from "../graph/render.js";
import { svgText } from "../graph/text.js";
import { translate } from "../i18n/index.js";
import {
  graphView,
  relationShown,
  visiblePeople,
} from "../model/graph-view.js";
import { withProjectIndex } from "../model/project.js";
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
    const zip = new JSZip(),
      manifest = clone(model);
    manifest.exportedAt = new Date().toISOString();
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
Photos are prepared copies; other documents retain their original contents.
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
    download(blob, safeName(model.title) + ".zip");
    toast(translate("ui.theArchiveContainsTheTreeAndAllAttachments"));
    if (model === appState.project && appState.editorActive) await saveNow();
  } catch (e) {
    toast(`${translate("ui.couldNotCreateArchive")} ` + e.message, true);
  } finally {
    btns.forEach((b) => (b.disabled = false));
  }
}
export async function exportImage(vector = false) {
  try {
    const { svg, width, height } = await fullSVG(
      $("#imageScope")?.value || "full",
    );
    if (vector) {
      download(
        new Blob([svg], {
          type: "image/svg+xml",
        }),
        safeName(appState.project.title) + ".svg",
      );
      toast(translate("ui.svgRetainsQualityAtAnyScale"));
      return;
    }
    let scale = Number($("#pngScale")?.value || 2);
    scale = Math.min(
      scale,
      16000 / width,
      16000 / height,
      Math.sqrt(48e6 / (width * height)),
    );
    const image = new Image(),
      url = URL.createObjectURL(
        new Blob([svg], {
          type: "image/svg+xml",
        }),
      );
    await new Promise((res, rej) => {
      image.onload = res;
      image.onerror = () => rej(Error(translate("ui.couldNotPrepareTheMap")));
      image.src = url;
    });
    const c = document.createElement("canvas");
    c.width = Math.ceil(width * scale);
    c.height = Math.ceil(height * scale);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(image, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    if (!blob) throw Error(translate("ui.mapTooLargeForPngChooseSvg"));
    download(blob, safeName(appState.project.title) + ".png");
    toast(`${translate("ui.map")} ${c.width} × ${c.height} px`);
  } catch (e) {
    toast(e.message, true);
  }
}
export function checkZip(buffer) {
  const v = new DataView(buffer);
  let end = -1;
  for (
    let i = buffer.byteLength - 22;
    i >= Math.max(0, buffer.byteLength - 65557);
    i--
  )
    if (v.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw Error(translate("ui.invalidZipArchive"));
  const count = v.getUint16(end + 10, true),
    offset = v.getUint32(end + 16, true);
  if (count > 2500 || count === 65535)
    throw Error(translate("ui.tooManyFilesInZip"));
  let at = offset,
    total = 0;
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (at + 46 > buffer.byteLength || v.getUint32(at, true) !== 0x02014b50)
      throw Error(translate("ui.damagedZipDirectory"));
    const size = v.getUint32(at + 24, true),
      nl = v.getUint16(at + 28, true),
      el = v.getUint16(at + 30, true),
      cl = v.getUint16(at + 32, true);
    if (size > 20 * 1048576)
      throw Error(translate("ui.anArchiveEntryIsTooLarge"));
    if (v.getUint16(at + 8, true) & 1)
      throw Error(translate("ui.encryptedZipArchivesAreNotSupported"));
    total += size;
    if (total > 150 * 1048576)
      throw Error(translate("ui.unpackedArchiveExceeds150Mb"));
    const path = decoder.decode(new Uint8Array(buffer, at + 46, nl));
    if (path.split(/[\\/]/).includes("..") || path.startsWith("/"))
      throw Error(translate("ui.invalidZipPath"));
    at += 46 + nl + el + cl;
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
      if (d.assetId) {
        if (!files.has(d.assetId))
          throw Error(translate("ui.documentAttachmentMissing"));
        d.mime = files.get(d.assetId).type;
        d.size = files.get(d.assetId).size;
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
          if (d.assetId === id) d.assetId = newId;
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
export async function fullSVG(scope = "full") {
  const images = {};
  for (const p of appState.project.people)
    if (p.avatarId && appState.blobs.has(p.avatarId))
      images[p.avatarId] = await dataUrl(appState.blobs.get(p.avatarId));
  const previous = appState.exportingDiagram;
  appState.exportingDiagram = scope === "view" ? "view" : "full";
  try {
    return withProjectIndex(() => {
      const b = bounds(),
        ns = filteredGraphNodes(),
        width = Math.ceil(Math.max(750, b.w + 12)),
        legend = exportLineLegend(width, b.h + 120),
        height = Math.ceil(b.h + 120 + legend.height + 18),
        people =
          scope === "view"
            ? visiblePeople(false).length
            : appState.project.people.length,
        ids = new Set(
          (scope === "view"
            ? visiblePeople(false)
            : appState.project.people
          ).map((p) => p.id),
        ),
        relations = appState.project.relations.filter(
          (r) => ids.has(r.from) && ids.has(r.to) && relationShown(r),
        ).length,
        sources = ns.filter((n) => n.kind === "document").length;
      const subtitle = `${scope === "view" ? translate("ui.currentMap2") : translate("ui.fullTree")} · ${people} ${translate("ui.people2")} ${relations} ${translate("ui.relationships")}${appState.showDocs ? " · " + sources + ` ${translate("ui.sources")}` : ""}${appState.project.demo ? ` ${translate("ui.fictionalDemoData")}` : ""}`;
      return {
        width,
        height,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${graphDefs()}</defs><rect width="100%" height="100%" fill="#fff"/>${svgText(appState.project.title, 38, 42, 90, 1, 26, "#081f3c", 600)}${svgText(subtitle, 38, 69, 120, 1, 13, "#3e516c", 400)}<g transform="translate(${-b.x + 6} ${105 - b.y})">${renderFilteredGraph(images, true)}</g>${legend.markup}</svg>`,
      };
    });
  } finally {
    appState.exportingDiagram = previous;
  }
}
export function exportDialog() {
  const filtered =
    appState.groupFilter ||
    appState.graphFocus ||
    graphView().types.length < Object.keys(relTypes()).length ||
    graphView().states.length < Object.keys(graphStateInfo()).length ||
    graphView().hiddenRelations.length;
  openDialog(translate("ui.exportTree"), renderExportForm(filtered), {
    footer: false,
  });
}
