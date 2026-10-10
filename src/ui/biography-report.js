import { personImageItems } from "../model/image-regions.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { renderBiography } from "./biography.js";
import { biographyImages } from "./biography-images.js";
import { imageItemKey } from "./media-image.js";

export const familyReportSections = [
  "basic",
  "biography",
  "names",
  "relationships",
  "groups",
  "civil",
  "education",
  "occupations",
  "residences",
  "military",
  "skills",
  "travel",
  "death",
  "timeline",
  "pets",
  "photographs",
];

/** Report choices affect presentation only; the complete profile remains available. */
export function biographyReport(
  biography,
  { sections = null, imageKeys = null, appendix = false } = {},
) {
  const template = document.createElement("template");
  template.innerHTML = renderBiography(biography);
  const content = template.content;
  content.querySelectorAll("button[data-document]").forEach((button) => {
    const citation = document.createElement("span");
    citation.className = "print-source";
    citation.textContent = button.textContent;
    button.replaceWith(citation);
  });
  content
    .querySelectorAll(
      ".biography-toolbar,.biography-record-actions,button,.biography-header .hint",
    )
    .forEach((element) => element.remove());
  if (sections)
    content.querySelectorAll("[data-biography-section]").forEach((section) => {
      if (!sections.includes(section.dataset.biographySection))
        section.remove();
    });
  const items = personImageItems(state.project, biography.profile.id).filter(
    (item) => !imageKeys || imageKeys.includes(imageItemKey(item)),
  );
  content.querySelectorAll("[data-biography-image]").forEach((figure) => {
    if (imageKeys && !imageKeys.includes(figure.dataset.biographyImage))
      figure.remove();
  });
  const shown = new Set(
    [...content.querySelectorAll("[data-biography-image]")].map(
      (figure) => figure.dataset.biographyImage,
    ),
  );
  const missing = items.filter((item) => !shown.has(imageItemKey(item)));
  const article = content.querySelector("article.biography");
  if (missing.length)
    article.insertAdjacentHTML(
      "beforeend",
      `<section class="biography-section" data-biography-section="photographs"><h3>${t("ui.imageRecordPhotos")}</h3>${biographyImages(missing, { eager: true })}</section>`,
    );
  content.querySelectorAll(".biography-images").forEach((gallery) => {
    if (!gallery.querySelector("figure")) gallery.remove();
  });
  content
    .querySelectorAll('[data-biography-section="photographs"]')
    .forEach((section) => {
      if (!section.querySelector("figure")) section.remove();
    });
  if (sections) {
    const order = [
      ...familyReportSections,
      ...sections.filter((key) => !familyReportSections.includes(key)),
    ];
    [...article.querySelectorAll(":scope > [data-biography-section]")]
      .sort(
        (a, b) =>
          order.indexOf(a.dataset.biographySection) -
          order.indexOf(b.dataset.biographySection),
      )
      .forEach((section) => article.append(section));
  }
  if (appendix) {
    const originals = new Map(
      items
        .filter((item) => item.region?.rect)
        .map((item) => [item.file.assetId, { ...item, region: null }]),
    );
    for (const item of items)
      if (!item.region?.rect) originals.delete(item.file.assetId);
    if (originals.size)
      article.insertAdjacentHTML(
        "beforeend",
        `<section class="biography-section" data-biography-section="appendix"><h3>${t("ui.reportAppendix")}</h3>${biographyImages([...originals.values()], { eager: true })}</section>`,
      );
  }
  content.querySelectorAll("button").forEach((button) => button.remove());
  content
    .querySelectorAll("img")
    .forEach((image) => image.removeAttribute("loading"));
  return template.innerHTML;
}
