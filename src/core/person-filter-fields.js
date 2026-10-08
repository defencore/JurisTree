/** Declarative filter fields shared by validation, the query engine and the editor. */
export const personFilterFields = {
  life: {
    group: "identity",
    label: "ui.filterLife",
    type: "choice",
    options: {
      living: "ui.living",
      deceased: "ui.deceased",
      unknown: "ui.unknown",
    },
  },
  age: { group: "identity", label: "ui.filterAge", type: "number", max: 1000 },
  minor: { group: "identity", label: "ui.filterMinor", type: "boolean" },
  gender: {
    group: "identity",
    label: "ui.gender",
    type: "choice",
    options: {
      m: "ui.male",
      f: "ui.female",
      x: "ui.nonbinaryOther",
      u: "ui.notSpecified",
    },
  },
  favorite: { group: "identity", label: "ui.filterFavorite", type: "boolean" },
  search: { group: "identity", label: "ui.filterAllValues", type: "search" },
  identityDocuments: {
    group: "evidence",
    label: "ui.filterIdentityDocuments",
    type: "number",
    max: 200,
  },
  documents: {
    group: "evidence",
    label: "ui.filterAvailableDocuments",
    type: "number",
    max: 1200,
  },
  sources: {
    group: "evidence",
    label: "ui.filterSourceRecords",
    type: "number",
    max: 1200,
  },
  files: {
    group: "evidence",
    label: "ui.filterAttachedFiles",
    type: "number",
    max: 1200,
  },
  official: {
    group: "evidence",
    label: "ui.filterOfficialDocuments",
    type: "number",
    max: 1200,
  },
  pending: {
    group: "evidence",
    label: "ui.filterPendingRecords",
    type: "number",
    max: 100000,
  },
  children: {
    group: "family",
    label: "ui.filterRecordedChildren",
    type: "number",
    max: 600,
  },
  adopted: { group: "family", label: "ui.filterAdopted", type: "boolean" },
  birthday: {
    group: "dates",
    label: "ui.filterBirthdayDays",
    type: "number",
    max: 366,
  },
  anniversary: {
    group: "dates",
    label: "ui.filterAnniversaryDays",
    type: "number",
    max: 366,
  },
  assetValue: { group: "assets", label: "ui.filterAssetValue", type: "money" },
  assetCount: {
    group: "assets",
    label: "ui.filterAssetCount",
    type: "number",
    max: 200,
  },
  accountCount: {
    group: "assets",
    label: "ui.financialAccounts",
    type: "number",
    max: 200,
  },
  cryptoCount: {
    group: "assets",
    label: "ui.cryptoAssets",
    type: "number",
    max: 200,
  },
  companyCount: {
    group: "assets",
    label: "ui.companiesAndInterests",
    type: "number",
    max: 200,
  },
  visited: {
    group: "countries",
    label: "ui.filterVisitedCountry",
    type: "text",
  },
  residence: {
    group: "countries",
    label: "ui.filterResidenceCountry",
    type: "text",
  },
  citizenship: {
    group: "countries",
    label: "ui.filterCitizenshipCountry",
    type: "text",
  },
  party: { group: "other", label: "ui.partyAffiliations", type: "text" },
  sanctions: {
    group: "other",
    label: "ui.filterSanctionKind",
    type: "choice",
    options: {
      designation: "ui.directDesignation",
      association: "ui.sanctionsAssociation",
    },
  },
  section: {
    group: "other",
    label: "ui.filterProfileSection",
    type: "section",
  },
  group: { group: "other", label: "ui.familyGroup", type: "group" },
};
export const filterGroups = {
  identity: "ui.filterIdentityGroup",
  evidence: "ui.filterEvidenceGroup",
  family: "ui.filterFamilyGroup",
  dates: "ui.filterDatesGroup",
  assets: "ui.filterAssetsGroup",
  countries: "ui.filterCountriesGroup",
  other: "ui.filterOtherGroup",
};
export const filterOperators = {
  eq: "ui.filterEquals",
  ne: "ui.filterNotEquals",
  gte: "ui.filterAtLeast",
  lte: "ui.filterAtMost",
  between: "ui.filterBetween",
  contains: "ui.filterContains",
  excludes: "ui.filterExcludes",
  missing: "ui.filterMissing",
  known: "ui.filterKnown",
  matches: "ui.filterMatches",
  notMatches: "ui.filterNotMatches",
};
export const filterSorts = {
  name: "ui.filterSortName",
  ageAsc: "ui.filterSortAgeAsc",
  ageDesc: "ui.filterSortAgeDesc",
  assetsDesc: "ui.filterSortAssets",
  birthday: "ui.filterSortBirthday",
};
export function operatorsFor(field) {
  const type = personFilterFields[field]?.type;
  if (type === "search") return ["matches", "notMatches"];
  if (["number", "money"].includes(type))
    return ["gte", "lte", "between", "eq", "ne", "missing", "known"];
  if (type === "text")
    return ["contains", "excludes", "eq", "ne", "missing", "known"];
  if (["section", "group"].includes(type))
    return ["eq", "ne", "missing", "known"];
  return ["eq", "ne"];
}
export const emptyPersonFilter = () => ({
  match: "all",
  rules: [],
  sort: "name",
  sortCurrency: "USD",
});
export function normalizePersonFilter(raw) {
  if (
    !raw ||
    !["all", "any"].includes(raw.match) ||
    !Array.isArray(raw.rules) ||
    raw.rules.length > 20 ||
    !Object.hasOwn(filterSorts, raw.sort)
  )
    throw Error("Invalid person filter");
  const currency = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .slice(0, 40);
  const rules = raw.rules.map((r) => {
    if (!r || !Object.hasOwn(personFilterFields, r.field))
      throw Error("Invalid filter field");
    const cfg = personFilterFields[r?.field];
    if (!cfg || !operatorsFor(r.field).includes(r.operator))
      throw Error("Invalid filter condition");
    const out = {
      field: r.field,
      operator: r.operator,
      value: String(r.value ?? "")
        .trim()
        .slice(0, 1500),
    };
    if (cfg.type === "money") {
      out.currency = currency(r.currency);
      if (!out.currency) throw Error("A filter currency is required");
    }
    if (["missing", "known"].includes(r.operator)) out.value = "";
    else if (["number", "money"].includes(cfg.type)) {
      const valid = (v) =>
        v !== "" &&
        Number.isFinite(Number(v)) &&
        Number(v) >= 0 &&
        (cfg.type === "money" ||
          (Number.isInteger(Number(v)) && Number(v) <= cfg.max));
      if (!valid(out.value)) throw Error("Invalid filter number");
      if (r.operator === "between") {
        out.max = String(r.max ?? "")
          .trim()
          .slice(0, 100);
        if (!valid(out.max) || Number(out.max) < Number(out.value))
          throw Error("Invalid filter range");
      }
    } else if (cfg.type === "boolean") {
      if (!["true", "false"].includes(out.value))
        throw Error("Invalid filter choice");
    } else if (cfg.type === "choice") {
      if (!Object.hasOwn(cfg.options, out.value))
        throw Error("Invalid filter choice");
    } else if (!out.value) throw Error("A filter value is required");
    return out;
  });
  return {
    match: raw.match,
    rules,
    sort: raw.sort,
    sortCurrency: currency(raw.sortCurrency) || "USD",
  };
}
