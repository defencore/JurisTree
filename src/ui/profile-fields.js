import { person } from "../model/project.js";
import { esc } from "../core/dom.js";
import { displayDate } from "../model/dates.js";

export function fields(entries) {
  const rows = entries.filter(([, value]) => value !== "" && value != null);
  return rows.length
    ? `<dl class="biography-fields">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`
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
      ];
    });
}
