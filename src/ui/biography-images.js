import { state } from "../core/state.js";
import { personDisplayName } from "../model/person-display.js";
import { objectUrl } from "../services/blobs.js";
import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
import { mediaImage, imageItemKey } from "./media-image.js";

export function biographyImages(items, { eager = false } = {}) {
  items = items.filter((item) => objectUrl(item.file.assetId));
  if (!items.length) return "";
  return `<div class="biography-images">${items
    .map((item) => {
      const { source, file, region } = item;
      const names = [
        ...new Set(
          (region?.targets || [])
            .map((target) => target.personId)
            .filter(Boolean),
        ),
      ]
        .map((id) =>
          personDisplayName(
            state.project.people.find((person) => person.id === id),
          ),
        )
        .filter(Boolean)
        .join(", ");
      const visual = mediaImage(file, region, { eager });
      if (!visual) return "";
      return `<figure class="biography-image" data-biography-image="${imageItemKey(item)}"><div class="biography-image-visual">${visual}</div><figcaption><b>${esc(region?.title || file.caption || names || source.title)}</b>${file.description ? `<p>${esc(file.description)}</p>` : ""}${file.inscription ? `<p>${t("ui.imageInscription")}: <em>${esc(file.inscription)}</em></p>` : ""}${region?.notes ? `<p>${esc(region.notes)}</p>` : ""}${source.date ? `<p>${esc(displayDate(source.date))}</p>` : ""}<small>${esc([source.title, source.repository, source.reference, source.pages].filter(Boolean).join(" · "))}</small><div><button type="button" class="btn small ghost" data-annotate-image="${source.id}" data-image-asset="${file.assetId}" data-image-region="${region?.id || ""}">${t("ui.imageContext")}</button></div></figcaption></figure>`;
    })
    .join("")}</div>`;
}
