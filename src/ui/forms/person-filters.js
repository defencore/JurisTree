import {
  personFilterFields,
  filterGroups,
  filterOperators,
  filterSorts,
  operatorsFor,
} from "../../core/person-filter-fields.js";
import { recordConfigs, sectionInfo } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { translate as t } from "../../i18n/index.js";
import { icon } from "../icons.js";
import { typeOptions } from "../components.js";

export const quickPersonFilters = [
  ["living", "ui.living", { field: "life", operator: "eq", value: "living" }],
  [
    "deceased",
    "ui.deceased",
    { field: "life", operator: "eq", value: "deceased" },
  ],
  [
    "minor",
    "ui.filterMinor",
    { field: "minor", operator: "eq", value: "true" },
  ],
  [
    "identityDocuments",
    "ui.filterWithIdentityDocuments",
    { field: "identityDocuments", operator: "gte", value: "1" },
  ],
  [
    "noIdentityDocuments",
    "ui.filterWithoutIdentityDocuments",
    { field: "identityDocuments", operator: "eq", value: "0" },
  ],
  [
    "documents",
    "ui.filterWithDocuments",
    { field: "documents", operator: "gte", value: "1" },
  ],
  [
    "noDocuments",
    "ui.filterWithoutDocuments",
    { field: "documents", operator: "eq", value: "0" },
  ],
  [
    "birthday",
    "ui.filterBirthdaySoon",
    { field: "birthday", operator: "lte", value: "30" },
  ],
  [
    "anniversary",
    "ui.filterAnniversarySoon",
    { field: "anniversary", operator: "lte", value: "30" },
  ],
  [
    "noChildren",
    "ui.filterNoChildren",
    { field: "children", operator: "eq", value: "0" },
  ],
  [
    "adopted",
    "ui.filterAdopted",
    { field: "adopted", operator: "eq", value: "true" },
  ],
];
export function filterValueOptions(field, project) {
  const cfg = personFilterFields[field];
  if (cfg.type === "boolean") return { true: t("ui.yes"), false: t("ui.no") };
  if (cfg.type === "section") {
    const configs = recordConfigs();
    return Object.fromEntries(
      Object.entries(sectionInfo())
        .filter(([key]) => configs[key])
        .map(([key, [label]]) => [key, label]),
    );
  }
  if (cfg.type === "group")
    return Object.fromEntries(project.groups.map((g) => [g.id, g.name]));
  return Object.fromEntries(
    Object.entries(cfg.options || {}).map(([key, label]) => [key, t(label)]),
  );
}
export function defaultFilterRule(field = "life", project) {
  const cfg = personFilterFields[field];
  return {
    field,
    operator: operatorsFor(field)[0],
    value: ["choice", "boolean", "section", "group"].includes(cfg.type)
      ? Object.keys(filterValueOptions(field, project))[0] || ""
      : ["number", "money"].includes(cfg.type)
        ? "0"
        : "",
    ...(cfg.type === "money" ? { currency: "USD" } : {}),
  };
}
export function renderFilterRule(rule, index, project) {
  const cfg = personFilterFields[rule.field];
  const grouped = Object.entries(filterGroups)
    .map(
      ([group, label]) =>
        `<optgroup label="${esc(t(label))}">${Object.entries(personFilterFields)
          .filter(([, f]) => f.group === group)
          .map(
            ([field, f]) =>
              `<option value="${field}" ${field === rule.field ? "selected" : ""}>${esc(t(f.label))}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
  const operatorOptions = Object.fromEntries(
    operatorsFor(rule.field).map((key) => [key, t(filterOperators[key])]),
  );
  const noValue = ["missing", "known"].includes(rule.operator);
  let value = "";
  if (!noValue) {
    const options = filterValueOptions(rule.field, project);
    value =
      Object.keys(options).length ||
      ["boolean", "choice", "section", "group"].includes(cfg.type)
        ? `<select data-filter-value aria-label="${t("ui.filterValue")}">${rule.value && !Object.hasOwn(options, rule.value) ? `<option value="${esc(rule.value)}" selected>${t("ui.filterUnavailableChoice")}: ${esc(rule.value)}</option>` : ""}${typeOptions(options, rule.value)}</select>`
        : `<input data-filter-value aria-label="${t("ui.filterValue")}" value="${esc(rule.value)}" ${["number", "money"].includes(cfg.type) ? `type="number" min="0" ${cfg.max ? `max="${cfg.max}"` : ""} step="${cfg.type === "money" ? "any" : "1"}"` : `type="text" maxlength="1500" list="filterCountrySuggestions"`} required>`;
    if (rule.operator === "between")
      value += `<span>${t("ui.filterRangeTo")}</span><input data-filter-max type="number" min="0" ${cfg.max ? `max="${cfg.max}"` : ""} step="${cfg.type === "money" ? "any" : "1"}" value="${esc(rule.max || "")}" aria-label="${t("ui.filterUpperBound")}" required>`;
  }
  if (cfg.type === "money")
    value += `<input data-filter-currency value="${esc(rule.currency || "USD")}" maxlength="40" list="filterCurrencySuggestions" aria-label="${t("ui.currency")}" placeholder="USD" required>`;
  return `<div class="person-filter-rule" data-filter-rule="${index}"><label class="field">${t("ui.filterField")}<select data-filter-field>${grouped}</select></label><label class="field">${t("ui.filterOperator")}<select data-filter-operator>${typeOptions(operatorOptions, rule.operator)}</select></label><div class="filter-rule-value">${value || `<span class="hint">${t("ui.filterNoValueNeeded")}</span>`}</div><button type="button" class="iconbtn" data-filter-command="remove" data-index="${index}" aria-label="${t("ui.filterRemoveRule")}">${icon("trash")}</button></div>`;
}
export function renderSavedPersonFilters(project, selected = "", name = "") {
  return `<label class="field">${t("ui.filterSavedViews")}<select id="savedPersonFilter"><option value="">${t("ui.filterCustomView")}</option>${(project.personFilterViews || []).map((v) => `<option value="${v.id}" ${v.id === selected ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label><label class="field">${t("ui.filterViewName")}<input id="personFilterName" maxlength="150" value="${esc(name)}"></label><button type="button" class="btn" data-filter-command="save">${icon("check")}${t("ui.filterSaveView")}</button><button type="button" class="iconbtn" data-filter-command="delete" ${selected ? "" : "disabled"} aria-label="${t("ui.filterDeleteView")}">${icon("trash")}</button>`;
}
export function renderPersonFilterForm(query, project, facts) {
  const countries = [
    ...new Set(
      facts.flatMap((f) => [...f.visited, ...f.residence, ...f.citizenship]),
    ),
  ].sort();
  const currencies = [
    ...new Set([
      "USD",
      "EUR",
      "UAH",
      ...facts.flatMap((f) => Object.keys(f.assetValue)),
    ]),
  ].sort();
  return `<div id="personFilterEditor"><p class="hint">${t("ui.filterIntro")}</p><div class="filter-saved-controls" id="filterSavedControls">${renderSavedPersonFilters(project)}</div><section class="filter-quick"><h3>${t("ui.filterQuickConditions")}</h3><div>${quickPersonFilters.map(([key, label]) => `<button type="button" class="btn small" data-filter-command="quick" data-preset="${key}">${t(label)}</button>`).join("")}</div></section><div class="filter-query-controls"><label class="field">${t("ui.filterCombine")}<select id="personFilterMatch">${typeOptions({ all: t("ui.filterMatchAll"), any: t("ui.filterMatchAny") }, query.match)}</select></label><button type="button" class="btn" data-filter-command="add">${icon("plus")}${t("ui.filterAddRule")}</button><button type="button" class="btn ghost" data-filter-command="clear">${t("ui.filterReset")}</button></div><div id="personFilterRules">${query.rules.map((r, i) => renderFilterRule(r, i, project)).join("")}</div><p id="filterEditorError" class="filter-error" role="status"></p><details class="filter-help"><summary>${t("ui.filterHowCalculated")}</summary><p>${t("ui.filterCalculationHelp")}</p><p>${t("ui.filterAssetsHelp")}</p></details><div class="filter-sort-controls"><label class="field">${t("ui.filterSort")}<select id="personFilterSort">${typeOptions(Object.fromEntries(Object.entries(filterSorts).map(([key, label]) => [key, t(label)])), query.sort)}</select></label><label class="field" id="filterSortCurrencyField" ${query.sort === "assetsDesc" ? "" : "hidden"}>${t("ui.currency")}<input id="personFilterSortCurrency" value="${esc(query.sortCurrency)}" maxlength="40" list="filterCurrencySuggestions"></label><button type="button" class="btn" data-filter-command="csv">${icon("download")}${t("ui.filterExportCsv")}</button></div><div id="personFilterResults" aria-live="polite"></div><datalist id="filterCountrySuggestions">${countries.map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist><datalist id="filterCurrencySuggestions">${currencies.map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist></div>`;
}
