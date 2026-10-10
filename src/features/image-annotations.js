import { state } from "../core/state.js";
import { uid, clone } from "../core/utils.js";
import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import { doc } from "../model/lookup.js";
import {
  normalizeImageRegions,
  mediaTargetOptions,
  mediaTargetLabel,
  targetKey,
  MAX_IMAGE_REGIONS,
} from "../model/image-regions.js";
import { boundedRegion } from "../model/region-geometry.js";
import { commit } from "../services/history.js";
import { imageDimensions } from "../services/attachment-files.js";
import { objectUrl } from "../services/blobs.js";
import {
  regionPortrait,
  assertPortraitCapacity,
} from "../services/image-region.js";
import { imageRegionEditor } from "../ui/image-region-editor.js";
import { bindRegionCanvas } from "../ui/region-canvas.js";
import { resetWindow } from "../ui/floating-windows.js";
import { toast } from "../ui/dialog.js";

export async function annotateImage(sourceId, assetId, selectedId = "") {
  const source = doc(sourceId),
    original = source?.attachments.find((file) => file.assetId === assetId);
  const url = original && objectUrl(assetId);
  if (!url || !original.mime.startsWith("image/")) return;
  const decoded = await imageDimensions(state.blobs.get(assetId));
  const file = {
    ...clone(original),
    width: decoded.naturalWidth,
    height: decoded.naturalHeight,
    regions: clone(original.regions || []),
  };
  const dialog = document.createElement("dialog");
  dialog.className = "media-editor";
  dialog.setAttribute("aria-label", t("ui.imageAnnotations"));
  dialog.innerHTML = imageRegionEditor(file, url);
  document.body.append(dialog);
  const controller = new AbortController(),
    options = { signal: controller.signal };
  const form = dialog.querySelector("form"),
    message = dialog.querySelector("[data-media-message]");
  let selected =
      file.regions.find((r) => r.id === selectedId) || file.regions[0] || null,
    canvas,
    busy = false;
  const targets = mediaTargetOptions(state.project),
    portraits = new Map();
  function targetOptions() {
    const query = dialog
      .querySelector("[data-media-search]")
      .value.toLocaleLowerCase();
    const matched = targets
      .map((option, index) => ({ ...option, index }))
      .filter((option) => option.label.toLocaleLowerCase().includes(query));
    dialog.querySelector("[data-media-target]").innerHTML =
      matched
        .map(
          (option) =>
            `<option value="${option.index}">${esc(option.label)}</option>`,
        )
        .join("") || `<option value="">${t("ui.imageNoTargets")}</option>`;
    dialog.querySelector("[data-media-add-link]").disabled = !matched.length;
  }
  function coordinates() {
    dialog.querySelector(".media-coordinates").hidden = !selected?.rect;
    if (selected?.rect)
      for (const input of dialog.querySelectorAll("[data-media-coordinate]"))
        input.value =
          Math.round(selected.rect[input.dataset.mediaCoordinate] * 10000) /
          100;
  }
  function links() {
    dialog.querySelector("[data-media-links]").innerHTML = (
      selected?.targets || []
    )
      .map(
        (target, index) =>
          `<div class="media-target-chip"><span>${esc(mediaTargetLabel(state.project, target))}</span><button type="button" class="iconbtn small" data-media-remove-link="${index}" aria-label="${t("ui.imageRemoveLink")}">×</button></div>`,
      )
      .join("");
    const people = state.project.people.filter((p) =>
      selected?.targets.some((target) => target.personId === p.id),
    );
    dialog.querySelector("[data-media-portrait-person]").innerHTML = people
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
      .join("");
    dialog.querySelector(".media-portrait-controls").hidden = !people.length;
  }
  function list() {
    const list = dialog.querySelector("[data-media-list]");
    list.innerHTML = file.regions
      .map(
        (region, index) =>
          `<button type="button" class="media-annotation-row ${selected === region ? "active" : ""}" data-media-select="${region.id}" aria-pressed="${selected === region}"><b>${index + 1}. ${esc(region.title || t(region.rect ? "ui.imageRegion" : "ui.imageWholeLabel"))}</b><small>${region.targets.map((target) => esc(mediaTargetLabel(state.project, target))).join(" · ")}</small></button>`,
      )
      .join("");
    const active = list.querySelector('[aria-pressed="true"]');
    if (active && active.offsetTop < list.scrollTop)
      list.scrollTop = active.offsetTop;
    else if (
      active &&
      active.offsetTop + active.offsetHeight >
        list.scrollTop + list.clientHeight
    )
      list.scrollTop =
        active.offsetTop + active.offsetHeight - list.clientHeight;
  }
  function select(id) {
    selected = file.regions.find((r) => r.id === id) || null;
    dialog.querySelector("[data-media-region-details]").hidden = !selected;
    dialog.querySelector("[data-media-title]").value = selected?.title || "";
    dialog.querySelector("[data-media-notes]").value = selected?.notes || "";
    list();
    links();
    coordinates();
    canvas?.render();
  }
  function create(rect) {
    if (file.regions.length >= MAX_IMAGE_REGIONS) {
      message.textContent = t("ui.imageRegionLimit", {
        count: MAX_IMAGE_REGIONS,
      });
      return;
    }
    const region = { id: uid(), title: "", notes: "", rect, targets: [] };
    file.regions.push(region);
    select(region.id);
    return true;
  }
  const finished = new Promise((resolve) =>
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "saved"),
      { once: true },
    ),
  );
  dialog.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
      const button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-reset-window")) resetWindow(dialog);
      if (button.hasAttribute("data-media-close")) dialog.close();
      if (button.hasAttribute("data-media-whole")) {
        create(null);
        canvas.setDrawing(false);
      }
      if (button.dataset.mediaSelect) select(button.dataset.mediaSelect);
      if (button.hasAttribute("data-media-delete") && selected) {
        file.regions = file.regions.filter((r) => r !== selected);
        select(file.regions[0]?.id);
      }
      if (button.hasAttribute("data-media-add-link") && selected) {
        const option =
          targets[Number(dialog.querySelector("[data-media-target]").value)];
        if (
          option &&
          !selected.targets.some(
            (target) => targetKey(target) === targetKey(option.target),
          )
        ) {
          if (selected.targets.length < 200)
            selected.targets.push({ ...option.target });
          else message.textContent = t("ui.invalidImageRegions");
        }
        links();
        list();
      }
      if (button.hasAttribute("data-media-remove-link") && selected) {
        selected.targets.splice(Number(button.dataset.mediaRemoveLink), 1);
        links();
        list();
      }
      if (button.hasAttribute("data-media-portrait") && !busy)
        preparePortrait();
    },
    options,
  );
  dialog.addEventListener(
    "input",
    (event) => {
      if (event.target.hasAttribute("data-media-search")) targetOptions();
      if (!selected) return;
      if (event.target.hasAttribute("data-media-title")) {
        selected.title = event.target.value;
        list();
        canvas.render();
      }
      if (event.target.hasAttribute("data-media-notes"))
        selected.notes = event.target.value;
      if (event.target.dataset.mediaCoordinate && selected.rect) {
        const value = Number(event.target.value);
        if (!Number.isFinite(value)) return;
        selected.rect = boundedRegion({
          ...selected.rect,
          [event.target.dataset.mediaCoordinate]: value / 100,
        });
        canvas.render();
      }
    },
    options,
  );
  dialog.addEventListener(
    "keydown",
    (event) => event.stopPropagation(),
    options,
  );
  async function preparePortrait() {
    const personId = dialog.querySelector("[data-media-portrait-person]").value;
    if (!personId || !selected) return;
    busy = true;
    form.querySelector('[type="submit"]').disabled = true;
    try {
      const blob = await regionPortrait(
        state.blobs.get(assetId),
        selected.rect,
      );
      if (!controller.signal.aborted) {
        portraits.set(personId, blob);
        message.textContent =
          t("ui.imageSetPortrait") +
          " · " +
          state.project.people.find((p) => p.id === personId).name +
          " · " +
          t("ui.save");
      }
    } catch (error) {
      message.textContent = error.message;
    } finally {
      busy = false;
      form.querySelector('[type="submit"]').disabled = false;
    }
  }
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      if (busy) return;
      try {
        const current = doc(sourceId)?.attachments.find(
          (f) => f.assetId === assetId,
        );
        if (!current) return dialog.close();
        const regions = normalizeImageRegions(file.regions);
        assertPortraitCapacity(state.project, state.blobs, portraits);
        commit(() => {
          Object.assign(current, {
            regions,
            caption: dialog.querySelector("[data-media-caption]").value,
            description: dialog.querySelector("[data-media-description]").value,
            inscription: dialog.querySelector("[data-media-inscription]").value,
            width: file.width,
            height: file.height,
          });
          for (const [id, blob] of portraits) {
            const person = state.project.people.find((p) => p.id === id);
            if (person) {
              person.avatarId = uid();
              state.blobs.set(person.avatarId, blob);
            }
          }
        });
        dialog.close("saved");
        toast(t("ui.imageSaved"));
      } catch (error) {
        message.textContent = error.message;
      }
    },
    options,
  );
  dialog.showModal();
  canvas = bindRegionCanvas(
    dialog,
    {
      regions: () => file.regions,
      selected: () => selected,
      select,
      create,
      remove: (id, previous) => {
        file.regions = file.regions.filter((region) => region.id !== id);
        select(previous || file.regions[0]?.id);
      },
      change: coordinates,
    },
    controller.signal,
  );
  select(selected?.id);
  targetOptions();
  const result = await finished;
  controller.abort();
  dialog.remove();
  return result;
}
