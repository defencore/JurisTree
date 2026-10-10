import {
  emptyPersonFilter,
  normalizePersonFilter,
} from "../core/person-filter-fields.js";
import { getLocale } from "../i18n/index.js";
import { localDateString } from "./dates.js";
import { buildPersonFilterFacts } from "./person-filter-facts.js";
import { buildSearchIndex, searchIndex } from "./search.js";

const folded = (value) =>
  String(value).normalize("NFKC").toLocaleLowerCase(getLocale()).trim();
const absent = (value) =>
  value == null || value === "" || (Array.isArray(value) && !value.length);
function compareNumber(value, rule) {
  if (value?.approximate) return false;
  const min = typeof value === "object" ? value.min : value;
  const max = typeof value === "object" ? value.max : value;
  const target = Number(rule.value);
  if (rule.operator === "eq") return min === target && max === target;
  if (rule.operator === "ne") return max < target || min > target;
  if (rule.operator === "gte") return min >= target;
  if (rule.operator === "lte") return max <= target;
  return min >= target && max <= Number(rule.max);
}
function matchesRule(fact, rule, searches) {
  if (rule.field === "search") {
    const matches = searches.get(rule.value).has(fact.id);
    return rule.operator === "matches" ? matches : !matches;
  }
  const value =
    rule.field === "assetValue"
      ? fact.assetValue[rule.currency]
      : fact[rule.field];
  if (rule.operator === "missing") return absent(value);
  if (rule.operator === "known") return !absent(value);
  if (absent(value)) return false;
  if (
    typeof value === "number" ||
    (rule.field === "age" && typeof value === "object")
  )
    return compareNumber(value, rule);
  if (typeof value === "boolean")
    return rule.operator === "eq"
      ? String(value) === rule.value
      : String(value) !== rule.value;
  if (["group", "section"].includes(rule.field)) {
    const match = value.includes(rule.value);
    return rule.operator === "eq" ? match : !match;
  }
  const values = (Array.isArray(value) ? value : [value]).map(folded);
  const target = folded(rule.value);
  const match = ["contains", "excludes"].includes(rule.operator)
    ? values.some((v) => v.includes(target))
    : values.includes(target);
  return ["ne", "excludes"].includes(rule.operator) ? !match : match;
}
export function evaluatePersonFilter(
  project,
  raw = emptyPersonFilter(),
  {
    today = localDateString(),
    files = new Map(),
    groupId = "",
    facts = null,
  } = {},
) {
  const query = normalizePersonFilter(raw);
  facts ||= buildPersonFilterFacts(project, today, files);
  const scope = facts.filter((f) => !groupId || f.group.includes(groupId));
  const searches = new Map();
  const searchRules = query.rules.filter((r) => r.field === "search");
  if (searchRules.length) {
    const index = buildSearchIndex(project);
    for (const r of searchRules)
      searches.set(
        r.value,
        new Set(
          searchIndex(index, r.value)
            .filter((x) => x.kind === "person")
            .map((x) => x.id),
        ),
      );
  }
  const matches = scope.filter(
    (f) =>
      !query.rules.length ||
      query.rules[query.match === "all" ? "every" : "some"]((r) =>
        matchesRule(f, r, searches),
      ),
  );
  const compare = (a, b) => {
    const field =
      query.sort === "assetsDesc"
        ? "assetValue"
        : query.sort === "birthday"
          ? "birthday"
          : "age";
    const get = (f) =>
      field === "assetValue"
        ? f.assetValue[query.sortCurrency]
        : field === "age"
          ? f.age?.min
          : f.birthday;
    const av = get(a),
      bv = get(b);
    if (query.sort !== "name") {
      if (av == null && bv != null) return 1;
      if (av != null && bv == null) return -1;
      if (av != null && bv != null && av !== bv)
        return (
          (av - bv) * (["ageDesc", "assetsDesc"].includes(query.sort) ? -1 : 1)
        );
    }
    return (
      a.person.name.localeCompare(b.person.name, getLocale()) ||
      a.id.localeCompare(b.id)
    );
  };
  matches.sort(compare);
  return {
    query,
    matches,
    total: scope.length,
    ids: new Set(matches.map((f) => f.id)),
    summary: {
      living: matches.filter((f) => f.life === "living").length,
      deceased: matches.filter((f) => f.life === "deceased").length,
      minors: matches.filter((f) => f.minor === true).length,
      withoutDocuments: matches.filter((f) => !f.documents).length,
      unknownAge: matches.filter((f) => !f.age).length,
      incompleteAssets: matches.reduce((sum, f) => sum + f.incompleteAssets, 0),
    },
  };
}
/** Spreadsheet formula prefixes are neutralized even inside quoted CSV cells. */
export function personFilterCsv(report, today = localDateString()) {
  const currencies = [
    ...new Set(report.matches.flatMap((f) => Object.keys(f.assetValue))),
  ].sort();
  const rows = [
    [
      "As of",
      "Person ID",
      "Name",
      "Life status",
      "Minimum age",
      "Maximum age",
      "Age approximate",
      "Identity document records",
      "Available sources",
      "Attached files",
      "Recorded children",
      "Recorded adoption",
      "Next birthday",
      "Next anniversary",
      "Visited destination countries",
      ...currencies.map((c) => "Recorded asset shares " + c),
    ],
  ];
  for (const f of report.matches)
    rows.push([
      today,
      f.id,
      f.person.name,
      f.life,
      f.age?.min,
      f.age?.max,
      f.age ? !!f.age.approximate : "",
      f.identityDocuments,
      f.documents,
      f.files,
      f.children,
      f.adopted,
      f.birthdayDate,
      f.anniversaryDate,
      [...new Set(f.visited)].join("; "),
      ...currencies.map((c) => f.assetValue[c]),
    ]);
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
