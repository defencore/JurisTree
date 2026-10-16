import {
  documentCategories,
  documentCategory,
  documentTypes,
} from "../core/document-catalog.js";
import { documentDetailsConfig } from "../core/document-details.js";
import { sourcePeopleIds } from "./image-regions.js";
import { displayDate } from "./dates.js";
import { personDisplayName } from "./person-display.js";
import { getLocale } from "../i18n/index.js";

function textValues(value) {
  if (Array.isArray(value)) return value.flatMap(textValues);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(textValues);
  return value == null ? [] : [String(value)];
}

export function documentMatches(project, source, query = "", category = "") {
  if (category && documentCategory(source) !== category) return false;
  const text = [
    ...textValues(source),
    documentTypes()[source.type],
    documentCategories()[documentCategory(source)],
    displayDate(source.date),
    ...documentDetailsConfig()
      .fields.filter(([, , type]) => ["date", "period"].includes(type))
      .map(([key]) => displayDate(source.details?.[key])),
    ...sourcePeopleIds(project, source).map((id) =>
      personDisplayName(project.people.find((person) => person.id === id)),
    ),
  ]
    .join(" ")
    .toLocaleLowerCase(getLocale());
  return query
    .trim()
    .toLocaleLowerCase(getLocale())
    .split(/\s+/)
    .every((word) => text.includes(word));
}

export function matchingDocuments(project, query = "", category = "") {
  return project.documents
    .filter((source) => documentMatches(project, source, query, category))
    .sort((a, b) => a.title.localeCompare(b.title, getLocale()));
}
