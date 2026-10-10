import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate as t } from "../i18n/index.js";
import { targetKey, MAX_IMAGE_REGIONS } from "../model/image-regions.js";
import { doc } from "../model/lookup.js";
import {
  regionPortrait,
  assertPortraitCapacity,
} from "../services/image-region.js";
import { commit } from "../services/history.js";
import { openDialog, toast } from "../ui/dialog.js";
import { mediaImage } from "../ui/media-image.js";
import { libraryImages } from "../ui/workspaces/image-library.js";

export async function selectLibraryImage(context) {
  const target = context.recordId
    ? {
        kind: "record",
        personId: context.personId,
        section: context.section,
        recordId: context.recordId,
      }
    : { kind: "person", personId: context.personId };
  let chosen = null;
  const controller = new AbortController();
  const result = await openDialog(
    t("ui.imageChoose"),
    `<label class="field">${t("ui.search")}<input data-library-search placeholder="${t("ui.imageLibrary")}"></label><div data-library-items></div>`,
    {
      wide: true,
      kind: "image-picker",
      footer: false,
      onOpen: () => {
        const root = $("#modalContent");
        function render() {
          root.querySelector("[data-library-items]").innerHTML =
            `<div class="media-picker-grid">${libraryImages(
              state.project,
              root.querySelector("[data-library-search]").value,
            )
              .flatMap(({ source, file }) => [
                { source, file, region: null },
                ...(file.regions || [])
                  .filter((region) => region.rect)
                  .map((region) => ({ source, file, region })),
              ])
              .map(
                ({ source, file, region }) =>
                  `<button type="button" class="media-picker-item" data-library-source="${source.id}" data-library-asset="${file.assetId}" data-library-region="${region?.id || ""}">${mediaImage(file, region, { maxHeight: 120 })}<span>${esc(region?.title || file.caption || source.title)} · ${t(region ? "ui.imageRegion" : "ui.imageWholeLabel")}</span></button>`,
              )
              .join("")}</div>`;
        }
        render();
        root
          .querySelector("[data-library-search]")
          .addEventListener("input", render, { signal: controller.signal });
        root.addEventListener(
          "click",
          (event) => {
            const button = event.target.closest("[data-library-source]");
            if (!button) return;
            chosen = {
              sourceId: button.dataset.librarySource,
              assetId: button.dataset.libraryAsset,
              regionId: button.dataset.libraryRegion,
            };
            $("#modalForm").requestSubmit();
          },
          { signal: controller.signal },
        );
      },
    },
  );
  controller.abort();
  if (!result || !chosen) return;
  const source = doc(chosen.sourceId),
    file = source?.attachments.find((file) => file.assetId === chosen.assetId);
  if (!file) return;
  const region = (file.regions || []).find(
    (region) => region.id === chosen.regionId,
  );
  if (
    !region &&
    !file.regions?.some((r) => !r.rect) &&
    file.regions?.length >= MAX_IMAGE_REGIONS
  )
    throw Error(t("ui.imageRegionLimit", { count: MAX_IMAGE_REGIONS }));
  let portrait;
  if (context.portrait) {
    portrait = await regionPortrait(
      state.blobs.get(file.assetId),
      region?.rect,
    );
    assertPortraitCapacity(
      state.project,
      state.blobs,
      new Map([[context.personId, portrait]]),
    );
  }
  commit(() => {
    file.regions ||= [];
    const annotation = region ||
      file.regions.find((r) => !r.rect) || {
        id: uid(),
        title: "",
        notes: "",
        rect: null,
        targets: [],
      };
    if (!file.regions.includes(annotation)) file.regions.push(annotation);
    if (
      annotation.targets.length >= 200 &&
      !annotation.targets.some((item) => targetKey(item) === targetKey(target))
    )
      throw Error(t("ui.invalidImageRegions"));
    if (
      !annotation.targets.some((item) => targetKey(item) === targetKey(target))
    )
      annotation.targets.push(target);
    if (portrait) {
      const person = state.project.people.find(
        (p) => p.id === context.personId,
      );
      person.avatarId = uid();
      state.blobs.set(person.avatarId, portrait);
    }
  });
  toast(t(context.portrait ? "ui.imagePortraitSaved" : "ui.imageLinked"));
}
