import { esc } from "../core/dom.js";
import { safeUrl } from "../core/utils.js";
import { contactHref } from "../model/contacts.js";
import { displayDate } from "../model/dates.js";
import { state } from "../core/state.js";
import { profileReferenceLabel } from "../model/profile-references.js";
import { translate } from "../i18n/index.js";

export function fields(entries) {
  const rows = entries.filter(
    ([, value]) =>
      value != null && (typeof value !== "string" || value.trim() !== ""),
  );
  return rows.length
    ? `<dl class="biography-fields">${rows.map(([label, value, href]) => `<div><dt>${esc(label)}</dt><dd>${href ? `<a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(value)}</a>` : esc(value)}</dd></div>`).join("")}</dl>`
    : "";
}

export function recordValues(cfg, record) {
  return cfg.fields
    .filter(([, , type]) => type !== "source")
    .map(([key, label, type, options]) => {
      const value = record[key] ?? "";
      return [
        label,
        value === "" || (type === "select" && value === "unspecified")
          ? ""
          : type === "select"
            ? options[value] || value
            : ["person", "relationship"].includes(type)
              ? profileReferenceLabel(state.project, type, value)
              : ["date", "period"].includes(type)
                ? displayDate(value)
                : value,
        type === "url"
          ? safeUrl(value)
          : cfg.key === "contacts" && key === "value"
            ? contactHref(record)
            : "",
      ];
    });
}

export function recordReferenceActions(cfg, record) {
  const people = [
    ...new Set(
      cfg.fields
        .filter(([key, , type]) => type === "person" && record[key])
        .map(([key]) => record[key]),
    ),
  ];
  const participants = people
    .map((id) => {
      const name = profileReferenceLabel(state.project, "person", id);
      return name
        ? `<button type="button" class="btn small" data-source-person="${esc(id)}">${esc(name)}</button>`
        : "";
    })
    .join("");
  const relationships = cfg.fields
    .filter(([key, , type]) => type === "relationship" && record[key])
    .map(([key]) => {
      const label = profileReferenceLabel(
        state.project,
        "relationship",
        record[key],
      );
      return label
        ? `<button type="button" class="btn small" data-source-relation="${esc(record[key])}" title="${esc(label)}">${translate("ui.openRelatedRelationship")}</button>`
        : "";
    })
    .join("");
  return participants || relationships
    ? `<div class="biography-record-actions">${participants}${relationships}</div>`
    : "";
}
