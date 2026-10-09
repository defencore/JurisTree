import { esc } from "../core/dom.js";
import { safeUrl } from "../core/utils.js";
import { contactHref } from "../model/contacts.js";
import { displayDate } from "../model/dates.js";
import { person } from "../model/lookup.js";

export function fields(entries) {
  const rows = entries.filter(([, value]) => value !== "" && value != null);
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
            : type === "person"
              ? person(value)?.name || ""
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
