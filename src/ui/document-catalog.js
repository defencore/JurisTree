import {
  documentCatalog,
  documentCategories,
  documentCategory,
} from "../core/document-catalog.js";
import { esc } from "../core/dom.js";
import { getLocale } from "../i18n/index.js";
import { partialDate } from "../model/dates.js";

export function documentTypeOptions(current, categoryFilter = "") {
  const catalog = Object.values(documentCatalog());
  return Object.entries(documentCategories())
    .filter(([key]) => !categoryFilter || key === categoryFilter)
    .map(
      ([category, label]) =>
        `<optgroup label="${esc(label)}">${catalog
          .filter((item) => item.category === category)
          .map(
            (item) =>
              `<option value="${item.type}" ${item.type === current ? "selected" : ""}>${esc(item.label)}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}

/** Categories follow the catalogue; dated documents precede undated records. */
export function groupedDocuments(documents) {
  return Object.entries(documentCategories())
    .map(([key, label]) => ({
      key,
      label,
      documents: documents
        .filter((source) => documentCategory(source) === key)
        .sort((a, b) => {
          const first = partialDate(a.date)?.min,
            second = partialDate(b.date)?.min;
          return (
            (first || "9999-99-99").localeCompare(second || "9999-99-99") ||
            a.title.localeCompare(b.title, getLocale())
          );
        }),
    }))
    .filter((group) => group.documents.length);
}

export function documentGroups(documents, render, heading = "h4") {
  return groupedDocuments(documents)
    .map(
      (group) =>
        `<div class="document-category" data-document-category="${group.key}"><${heading} class="document-category-heading">${esc(group.label)} <span>${group.documents.length}</span></${heading}>${group.documents.map(render).join("")}</div>`,
    )
    .join("");
}
