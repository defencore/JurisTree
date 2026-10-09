import { MAX_ATTACHMENT_FILES } from "../core/attachments.js";
import { MAX_ATTACHMENT_BYTES } from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { bytes, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import {
  MAX_SOURCE_FILES,
  projectAttachmentIds,
} from "../model/source-attachments.js";
import { prepareAttachment } from "../services/attachment-files.js";
import { objectUrl } from "../services/blobs.js";
import { pastedImages, readClipboardImages } from "../services/clipboard.js";
import { icon, icons } from "../ui/icons.js";

export function bindSourceAttachments(root, source, initialFiles = []) {
  const entries = source.attachments.map((file) => ({ ...file }));
  const blobs = new Map(),
    urls = new Map();
  const panel = root.querySelector("[data-attachment-input]");
  const input = panel.querySelector("[data-attachment-files]");
  const message = panel.querySelector("[data-attachment-message]");
  let active = true,
    busy = 0;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  function attachmentIds() {
    return projectAttachmentIds({
      people: appState.project.people,
      documents: [
        ...appState.project.documents.filter((d) => d.id !== source.id),
        { attachments: entries },
      ],
    });
  }
  function total() {
    const ids = attachmentIds();
    return [...ids].reduce(
      (sum, id) => sum + ((blobs.get(id) || appState.blobs.get(id))?.size || 0),
      0,
    );
  }
  function updateBusy(change) {
    busy += change;
    if (!active) return;
    root.querySelector('[type="submit"]').disabled = busy > 0;
    panel.querySelector("[data-paste-images]").disabled = busy > 0;
    panel.setAttribute("aria-busy", String(busy > 0));
  }
  function render() {
    if (!active) return;
    panel.querySelector("[data-attachment-list]").innerHTML = entries
      .map((file, index) => {
        const url = urls.get(file.assetId) || objectUrl(file.assetId);
        return `<div class="attachment-row" data-staged-attachment="${file.assetId}"><span class="attachment-thumb">${file.mime.startsWith("image/") && url ? `<img src="${url}" alt="" loading="lazy" decoding="async">` : icon("file")}</span><div><b>${index + 1}. ${esc(file.filename)}</b><small>${bytes(file.size)}</small><label class="attachment-caption">${translate("ui.attachmentCaption")}<input data-attachment-caption="${file.assetId}" value="${esc(file.caption)}" maxlength="500"></label></div><button type="button" class="iconbtn" data-remove-attachment="${file.assetId}" aria-label="${esc(translate("ui.removeAttachment", { name: file.filename }))}" title="${translate("ui.delete")}">${icon("trash")}</button></div>`;
      })
      .join("");
    icons();
  }
  async function add(files) {
    updateBusy(1);
    if (active) message.textContent = "";
    try {
      for (const file of files) {
        try {
          if (entries.length >= MAX_SOURCE_FILES)
            throw Error(
              translate("ui.sourceAttachmentLimit", {
                limit: MAX_SOURCE_FILES,
              }),
            );
          if (attachmentIds().size >= MAX_ATTACHMENT_FILES)
            throw Error(
              translate("ui.projectAttachmentLimit", {
                limit: MAX_ATTACHMENT_FILES,
              }),
            );
          const prepared = await prepareAttachment(file);
          if (!active) return;
          if (total() + prepared.size > MAX_ATTACHMENT_BYTES)
            throw Error(
              translate("ui.attachmentsAreApproaching100MbSaveAnArchive"),
            );
          const assetId = uid(),
            { blob, ...metadata } = prepared;
          entries.push({ assetId, caption: "", ...metadata });
          blobs.set(assetId, blob);
          if (blob.type.startsWith("image/"))
            urls.set(assetId, URL.createObjectURL(blob));
          render();
        } catch (error) {
          if (active) message.textContent += `${file.name}: ${error.message} `;
        }
      }
    } finally {
      updateBusy(-1);
    }
  }
  async function paste() {
    updateBusy(1);
    try {
      const files = await readClipboardImages();
      if (active) await add(files);
    } catch (error) {
      if (active) {
        message.textContent = error.message;
        panel.querySelector("[data-image-paste]").focus();
      }
    } finally {
      updateBusy(-1);
    }
  }
  panel.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("[data-choose-attachments]")) input.click();
      if (event.target.closest("[data-paste-images]")) paste();
      const button = event.target.closest("[data-remove-attachment]");
      if (button) {
        const id = button.dataset.removeAttachment;
        entries.splice(
          entries.findIndex((file) => file.assetId === id),
          1,
        );
        blobs.delete(id);
        if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
        urls.delete(id);
        render();
      }
    },
    options,
  );
  panel.addEventListener(
    "input",
    (event) => {
      const id = event.target.dataset.attachmentCaption;
      const file = entries.find((file) => file.assetId === id);
      if (file) file.caption = event.target.value;
    },
    options,
  );
  input.addEventListener(
    "change",
    () => {
      add([...input.files]);
      input.value = "";
    },
    options,
  );
  root.addEventListener(
    "paste",
    (event) => {
      const files = pastedImages(event);
      if (files.length) {
        event.preventDefault();
        event.stopPropagation();
        add(files);
      } else if (event.target.matches("[data-image-paste]")) {
        event.preventDefault();
        message.textContent = translate("ui.clipboardNoImage");
      }
    },
    options,
  );
  panel.addEventListener(
    "dragover",
    (event) => {
      event.preventDefault();
      panel.classList.add("drag-over");
    },
    options,
  );
  panel.addEventListener(
    "dragleave",
    () => panel.classList.remove("drag-over"),
    options,
  );
  panel.addEventListener(
    "drop",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      panel.classList.remove("drag-over");
      add([...event.dataTransfer.files]);
    },
    options,
  );
  render();
  if (initialFiles.length) add(initialFiles);
  return {
    entries,
    blobs,
    paste,
    error: () =>
      busy
        ? translate("ui.attachmentsProcessing")
        : total() > MAX_ATTACHMENT_BYTES
          ? translate("ui.attachmentLimitExceeded")
          : "",
    dispose() {
      active = false;
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}
