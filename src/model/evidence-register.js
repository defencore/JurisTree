import { documentMatches } from "./document-library.js";
import { hasFile } from "./evidence.js";
import { sourceNeedsReview } from "../core/sources.js";
import { documentDetailsConfig } from "../core/document-details.js";
import { types } from "../core/config.js";
import { displayDate } from "./dates.js";
import { translate as t } from "../i18n/index.js";

export function evidenceRegisterSelection(project, filters) {
  const matched = project.documents.filter(
    (d) =>
      (filters.docShowAll ||
        !d.purposes?.length ||
        d.purposes.includes(project.purpose)) &&
      (!filters.docTypeFilter || d.type === filters.docTypeFilter) &&
      (!filters.docFileFilter ||
        hasFile(d) === (filters.docFileFilter === "attached")) &&
      documentMatches(project, d, filters.docFilter, filters.docCategoryFilter),
  );
  const docs = matched.filter((d) =>
    !filters.docStatusFilter
      ? true
      : filters.docStatusFilter === "review"
        ? sourceNeedsReview(d)
        : d.status === filters.docStatusFilter,
  );
  return { matched, docs };
}
export function evidenceRegisterRows(sources) {
  const copies = documentDetailsConfig().fields.find(
    ([key]) => key === "copyKind",
  )[3];
  return sources.map((source) => {
    const details = source.details || {};
    return [
      source.id,
      source.title,
      types()[source.type],
      details.custodian || "",
      details.copyKind && details.copyKind !== "unspecified"
        ? copies[details.copyKind]
        : "",
      details.supportedFact || "",
      details.acquisitionRoute || "",
      details.inventoryNumber || "",
      details.originalLocation || "",
      displayDate(details.receivedAt),
      details.receivedFrom || "",
      [source.source, source.repository, source.reference, source.sourceUrl]
        .filter(Boolean)
        .join(" · "),
      source.attachments?.length || 0,
    ];
  });
}
export function evidenceRegisterHeaders() {
  return [
    "ID",
    t("ui.source"),
    t("ui.type"),
    t("ui.evidenceCustodian"),
    t("ui.documentCopyKind"),
    t("ui.evidenceFact"),
    t("ui.evidenceRoute"),
    t("ui.evidenceInventory"),
    t("ui.documentOriginalLocation"),
    t("ui.evidenceReceived"),
    t("ui.evidenceReceivedFrom"),
    t("ui.sourceProvenance"),
    t("ui.file"),
  ];
}
export function evidenceRegisterCsv(sources) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [evidenceRegisterHeaders(), ...evidenceRegisterRows(sources)]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
