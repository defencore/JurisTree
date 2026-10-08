import { recordConfigs } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { uid } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { dateExact } from "../../model/dates.js";
import { typeOptions, personOptions } from "../components.js";
import { icon } from "../icons.js";

function field(section, record, [key, label, type, options], cfg) {
  const name = section + "-" + key;
  const value = record[key] ?? "";
  let input;
  if (type === "select")
    input = `<select name="${name}">${typeOptions(options, value || Object.keys(options)[0])}</select>`;
  else if (type === "person")
    input = `<select name="${name}">${personOptions(value, true)}</select>`;
  else if (type === "source")
    input = `<select name="${name}"><option value="">${translate("ui.noSource")}</option>${appState.project.documents.map((d) => `<option value="${d.id}" ${d.id === value ? "selected" : ""}>${esc(d.title)}</option>`).join("")}</select>`;
  else if (type === "textarea")
    input = `<textarea name="${name}" rows="3" maxlength="5000">${esc(value)}</textarea>`;
  else
    input = `<input name="${name}" type="${["date", "url"].includes(type) ? type : ["number", "year"].includes(type) ? "number" : "text"}" value="${esc(type === "date" ? dateExact(value) : value)}" ${type === "number" ? `step="any" inputmode="decimal" ${cfg.numericMinimums?.[key] != null ? `min="${cfg.numericMinimums[key]}"` : ""}` : type === "year" ? 'min="1" max="9999" step="1" inputmode="numeric"' : 'maxlength="1000"'} ${type === "period" ? `placeholder="${translate("ui.yearOrYyyyMmDd")}"` : ""}>`;
  return `<label class="field ${["textarea", "source"].includes(type) ? "full" : ""}">${esc(label)}${input}</label>`;
}

export function renderProfileRecord(section, record = {}) {
  const cfg = recordConfigs()[section];
  return `<div class="profile-record" data-record-section="${section}"><div class="record-row-head"><b>${esc(cfg.label)}</b><button type="button" class="iconbtn small ghost" data-remove-record aria-label="${translate("ui.deleteRecord")}">${icon("trash")}</button></div>${cfg.hint ? `<p class="hint">${esc(cfg.hint)}</p>` : ""}<input type="hidden" name="${section}-id" value="${record.id || uid()}">${renderRecordFields(section, cfg, record)}</div>`;
}

export function renderRecordFields(section, cfg, record = {}) {
  const groups = cfg.groups || [{ label: "", fields: cfg.fields }];
  return groups
    .map((group) => {
      const inputs = `<div class="form-grid">${group.fields.map((entry) => field(section, record, entry, cfg)).join("")}</div>`;
      return group.label
        ? `<details class="record-field-group"><summary>${esc(group.label)}${icon("chevron")}</summary>${inputs}</details>`
        : inputs;
    })
    .join("");
}
