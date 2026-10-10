import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { recordConfigs } from "../core/config.js";
import { personBiography } from "../model/biography.js";
import { personImageItems } from "../model/image-regions.js";
import { openDialog } from "../ui/dialog.js";
import { renderBiography } from "../ui/biography.js";
import {
  biographyReport,
  familyReportSections,
} from "../ui/biography-report.js";
import { imageItemKey } from "../ui/media-image.js";
import { printBiography } from "./print-biography.js";

export async function prepareBiographyReport(id) {
  const biography = personBiography(state.project, id);
  if (!biography) return;
  const template = document.createElement("template");
  template.innerHTML = renderBiography(biography);
  const sections = [
    ...template.content.querySelectorAll(
      '[data-biography-section]:not([data-biography-section="photographs"])',
    ),
  ].map((section) => ({
    key: section.dataset.biographySection,
    label: section.querySelector("h3").textContent,
  }));
  const images = personImageItems(state.project, id).filter((item) =>
    state.blobs.has(item.file.assetId),
  );
  const controller = new AbortController();
  let reportOptions;
  const result = await openDialog(
    t("ui.reportOptions"),
    `<div class="report-controls"><label class="field">${t("ui.profileReport")}<select data-report-mode><option value="family">${t("ui.reportFamily")}</option><option value="complete">${t("ui.reportComplete")}</option></select></label><p class="hint">${t("ui.reportFamilyHint")}</p></div><details open><summary>${t("ui.reportSections")}</summary><div class="report-sections">${sections.map((section) => `<label><input type="checkbox" name="report-section" value="${section.key}" ${familyReportSections.includes(section.key) ? "checked" : ""}>${esc(section.label)}</label>`).join("")}</div></details><details><summary>${t("ui.reportImages")} (${images.length})</summary><div class="report-image-options">${images.map((item) => `<label><input type="checkbox" name="report-image" value="${imageItemKey(item)}"><span>${esc(item.region?.title || item.file.caption || item.source.title)}</span></label>`).join("")}</div><label><input type="checkbox" name="report-appendix"> ${t("ui.reportContext")}</label></details><h3>${t("ui.reportPreview")}</h3><div class="report-preview" data-report-preview></div>`,
    {
      wide: true,
      kind: "biography-report",
      submit: t("ui.reportPrint"),
      validate: (data) =>
        !data.getAll("report-section").length &&
        !data.getAll("report-image").length
          ? t("ui.reportChooseSection")
          : "",
      onOpen: () => {
        const root = $("#modalContent");
        function options() {
          return {
            sections: [
              ...root.querySelectorAll('[name="report-section"]:checked'),
            ].map((input) => input.value),
            imageKeys: [
              ...root.querySelectorAll('[name="report-image"]:checked'),
            ].map((input) => input.value),
            appendix: root.querySelector('[name="report-appendix"]').checked,
          };
        }
        function preview() {
          reportOptions = options();
          root.querySelector("[data-report-preview]").innerHTML =
            biographyReport(biography, reportOptions);
        }
        function preset() {
          const full =
            root.querySelector("[data-report-mode]").value === "complete";
          root.querySelectorAll('[name="report-section"]').forEach((input) => {
            input.checked = full || familyReportSections.includes(input.value);
          });
          const familySources = new Set(
            familyReportSections.flatMap((section) =>
              (biography.profile[recordConfigs()[section]?.key] || []).map(
                (record) => record.sourceId,
              ),
            ),
          );
          root.querySelectorAll('[name="report-image"]').forEach((input) => {
            const item = images.find(
              (item) => imageItemKey(item) === input.value,
            );
            input.checked =
              full ||
              (item.region
                ? item.region.targets.some(
                    (target) =>
                      target.kind === "person" ||
                      target.kind === "relation" ||
                      (target.kind === "record" &&
                        familyReportSections.includes(target.section)),
                  )
                : item.source.type === "photo" ||
                  familySources.has(item.source.id));
          });
          preview();
        }
        root.addEventListener(
          "change",
          (event) =>
            event.target.hasAttribute("data-report-mode")
              ? preset()
              : preview(),
          { signal: controller.signal },
        );
        preset();
      },
    },
  );
  controller.abort();
  if (result) await printBiography(id, reportOptions);
}
