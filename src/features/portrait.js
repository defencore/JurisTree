import { MAX_ATTACHMENT_FILES } from "../core/attachments.js";
import { MAX_ATTACHMENT_BYTES } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { storageTotal } from "../model/evidence.js";
import { projectAttachmentIds } from "../model/source-attachments.js";
import { person } from "../model/lookup.js";
import { pastedImages, readClipboardImages } from "../services/clipboard.js";
import { commit } from "../services/history.js";
import { attachmentInput } from "../ui/attachment-input.js";
import { cropImage } from "../ui/cropper.js";
import { openDialog, closeModal, toast } from "../ui/dialog.js";

export async function setPortrait(id, file) {
  try {
    if (!person(id)) return;
    const availableIds = projectAttachmentIds({
      ...appState.project,
      people: appState.project.people.map((p) =>
        p.id === id ? { ...p, avatarId: "" } : p,
      ),
    });
    if (availableIds.size >= MAX_ATTACHMENT_FILES)
      throw Error(
        translate("ui.projectAttachmentLimit", { limit: MAX_ATTACHMENT_FILES }),
      );
    const blob = await cropImage(file, true);
    if (!blob) return;
    if (storageTotal() + blob.size > MAX_ATTACHMENT_BYTES)
      throw Error(translate("ui.attachmentLimitExceeded"));
    commit(() => {
      const aid = uid();
      appState.blobs.set(aid, blob);
      person(id).avatarId = aid;
    });
  } catch (error) {
    toast(error.message, true);
  }
}

export async function openPortraitPicker(id) {
  if (!person(id)) return;
  const controller = new AbortController(),
    options = { signal: controller.signal };
  let reading = false;
  await openDialog(
    translate("ui.personProfilePhoto"),
    attachmentInput({ portrait: true }) +
      `<button type="button" class="btn" data-media-library="${id}" data-library-portrait>${translate("ui.imageFromLibrary")}</button>`,
    {
      kind: "portrait-picker",
      footer: false,
      onOpen: () => {
        const root = $("#modalForm"),
          input = root.querySelector("[data-attachment-files]");
        const message = root.querySelector("[data-attachment-message]");
        function choose(files) {
          if (!files.length) return;
          closeModal();
          setPortrait(id, files[0]);
        }
        root.addEventListener(
          "click",
          async (event) => {
            if (event.target.closest("[data-choose-attachments]"))
              input.click();
            if (event.target.closest("[data-paste-images]") && !reading) {
              reading = true;
              try {
                const files = await readClipboardImages();
                if (!controller.signal.aborted) choose(files);
              } catch (error) {
                if (!controller.signal.aborted) {
                  message.textContent = error.message;
                  root.querySelector("[data-image-paste]").focus();
                }
              } finally {
                reading = false;
              }
            }
          },
          options,
        );
        input.addEventListener(
          "change",
          () => choose([...input.files]),
          options,
        );
        root.addEventListener(
          "paste",
          (event) => {
            const files = pastedImages(event);
            if (files.length) {
              event.preventDefault();
              event.stopPropagation();
              choose(files);
            } else if (event.target.matches("[data-image-paste]")) {
              event.preventDefault();
              message.textContent = translate("ui.clipboardNoImage");
            }
          },
          options,
        );
      },
    },
  );
  controller.abort();
}
