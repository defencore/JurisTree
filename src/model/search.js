import { profileReferenceLabel } from "./profile-references.js";
import {
  evidenceTypes,
  recordConfigs,
  relTypes,
  sectionInfo,
  statusTypes,
  types,
} from "../core/config.js";
import { relationshipConfig } from "../core/relationships.js";
import { propertyRecordConfigs } from "../core/property-records.js";
import { propertyPeople, propertyRecords } from "./property-records.js";
import { catalogs, translate } from "../i18n/index.js";
import { personBiography } from "./biography.js";
import { displayDate, years } from "./dates.js";

export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’ʼ`]/g, "'")
    .replace(/(\d),(?=\d)/g, "$1.")
    .replace(/\s+/g, " ")
    .trim();
}
const aliases = Object.fromEntries(
  Object.entries({
    name: "name",
    surname: "name",
    імя: "name",
    "ім'я": "name",
    прізвище: "name",
    имя: "name",
    фамилия: "name",
    gender: "gender",
    sex: "gender",
    стать: "gender",
    пол: "gender",
    document: "document",
    doc: "document",
    документ: "document",
    country: "country",
    країна: "country",
    страна: "country",
    type: "type",
    тип: "type",
  }).map(([key, value]) => [normalizeSearch(key), value]),
);
const genders = Object.fromEntries(
  Object.entries({
    m: "m",
    male: "m",
    man: "m",
    чоловік: "m",
    чоловіча: "m",
    мужчина: "m",
    мужской: "m",
    f: "f",
    female: "f",
    woman: "f",
    жінка: "f",
    жіноча: "f",
    женщина: "f",
    женский: "f",
    x: "x",
    nonbinary: "x",
    "non-binary": "x",
    небінарна: "x",
    небинарный: "x",
    u: "u",
    unknown: "u",
    unspecified: "u",
    невідомо: "u",
    неизвестно: "u",
  }).map(([key, value]) => [normalizeSearch(key), value]),
);
export function parseSearchQuery(query) {
  const groups = [[]];
  for (const match of String(query).matchAll(
    /-?(?:[^\s|":]+:)?(?:"[^"]*"|[^\s|]+)|\|/gu,
  )) {
    let raw = match[0];
    if (raw === "|") {
      if (groups.at(-1).length) groups.push([]);
      continue;
    }
    const exclude = raw.startsWith("-");
    if (exclude) raw = raw.slice(1);
    const colon = raw.indexOf(":"),
      alias = colon > 0 ? aliases[normalizeSearch(raw.slice(0, colon))] : "";
    const value = normalizeSearch(
      (alias ? raw.slice(colon + 1) : raw).replace(/^"|"$/g, ""),
    );
    if (value) groups.at(-1).push({ field: alias || "", value, exclude });
  }
  return groups.filter((g) => g.length);
}
function flat(value) {
  if (Array.isArray(value)) return value.flatMap(flat);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(flat);
  return value === "" || value == null ? [] : [String(value)];
}
function countries(value) {
  if (Array.isArray(value)) return value.flatMap(countries);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) =>
    /country|citizenship|nationality|jurisdiction/i.test(key)
      ? flat(item)
      : countries(item),
  );
}

/** Build a local index of stored values, labels and linked context, independent of workspace filters. */
export function buildSearchIndex(project) {
  const configs = recordConfigs(),
    sections = sectionInfo(),
    people = new Map(project.people.map((p) => [p.id, p]));
  const terminology = new Map();
  for (const key of Object.keys(catalogs.en)) {
    const values = Object.values(catalogs).map((catalog) => catalog[key]);
    for (const value of values) terminology.set(value, values.join(" "));
  }
  const labels = (value) => terminology.get(value) || value;
  function recordText(cfg, record) {
    return cfg.fields
      .flatMap(([key, label, type, options]) => {
        const value = record[key];
        if (value === "" || value == null) return [];
        return [
          labels(label),
          value,
          type === "select"
            ? labels(options[value] || value)
            : ["person", "source", "relationship"].includes(type)
              ? profileReferenceLabel(project, type, value)
              : ["date", "period"].includes(type)
                ? displayDate(value)
                : "",
        ];
      })
      .join(" ");
  }
  const describeDocument = (d) =>
    [
      ...flat(d),
      labels(types()[d.type] || ""),
      labels(statusTypes()[d.status] || ""),
      labels(evidenceTypes()[d.evidence] || ""),
    ].join(" ");
  const describeRelation = (r) =>
    [
      ...flat(r),
      people.get(r.from)?.name,
      people.get(r.to)?.name,
      labels(relTypes()[r.type]),
      recordText(relationshipConfig(), r),
    ].join(" ");
  const describeProperty = (a) =>
    [
      ...flat(a),
      people.get(a.ownerId)?.name,
      ...a.allocations.map((s) => people.get(s.personId)?.name),
      ...[...propertyPeople(a)].map((id) => people.get(id)?.name),
      ...propertyRecords(a).map(({ kind, record }) =>
        recordText(propertyRecordConfigs()[kind], record),
      ),
    ].join(" ");
  const entries = [];
  function add(kind, item, title, subtitle, text, fields = {}) {
    const kindLabel = translate(
      {
        person: "ui.searchPerson",
        document: "ui.searchDocument",
        relation: "ui.searchRelationship",
        property: "ui.searchProperty",
        group: "ui.searchGroup",
      }[kind],
    );
    entries.push({
      kind,
      id: item.id,
      title,
      subtitle,
      kindLabel,
      text: normalizeSearch([title, kind, labels(kindLabel), text].join(" ")),
      fields: Object.fromEntries(
        Object.entries({
          name: title,
          type: kind + " " + labels(kindLabel),
          ...fields,
        }).map(([key, value]) => [key, normalizeSearch(value)]),
      ),
    });
  }
  for (const p of project.people) {
    const bio = personBiography(project, p.id);
    const records = Object.entries(configs).flatMap(([key, cfg]) =>
      (p[cfg.key] || []).flatMap((r) => [
        labels(sections[key][0]),
        recordText(cfg, r),
      ]),
    );
    const documents = [
      ...bio.documents.map(describeDocument),
      ...(p.identityDocuments || []).map((r) =>
        recordText(configs.identity, r),
      ),
    ].join(" ");
    const gender = Object.keys(genders)
      .filter((term) => genders[term] === (p.gender || "u"))
      .join(" ");
    add(
      "person",
      p,
      p.name,
      years(p),
      [
        ...flat(p),
        ...records,
        ...bio.testimony.flatMap(({ personName, record }) => [
          personName,
          recordText(configs.witnesses, record),
        ]),
        gender,
        displayDate(p.birth),
        displayDate(p.death),
        documents,
        ...bio.relations.map(describeRelation),
        ...bio.property.map(describeProperty),
        ...bio.groups.flatMap(flat),
      ].join(" "),
      {
        name: [
          p.name,
          p.aliases,
          ...(p.nameHistory || []).flatMap((r) => [r.fullName, r.surname]),
        ].join(" "),
        gender,
        genderCode: p.gender || "u",
        document: documents,
        country: countries(p).join(" "),
      },
    );
  }
  for (const d of project.documents)
    add("document", d, d.title, types()[d.type], describeDocument(d), {
      document: describeDocument(d),
      type: "document " + d.type + " " + labels(types()[d.type]),
      country: countries(d).join(" "),
    });
  for (const r of project.relations)
    add(
      "relation",
      r,
      [people.get(r.from)?.name, people.get(r.to)?.name].join(" ↔ "),
      relTypes()[r.type],
      describeRelation(r),
      { type: "relation " + r.type + " " + labels(relTypes()[r.type]) },
    );
  for (const a of project.property)
    add(
      "property",
      a,
      a.title,
      people.get(a.ownerId)?.name || "",
      describeProperty(a),
    );
  for (const g of project.groups)
    add(
      "group",
      g,
      g.name,
      "",
      [
        ...flat(g),
        ...project.people
          .filter((p) => (p.groupIds || []).includes(g.id))
          .map((p) => p.name),
      ].join(" "),
    );
  return entries;
}
export function searchIndex(index, query) {
  const groups = parseSearchQuery(query);
  if (!groups.length) return [];
  const matches = (entry, term) => {
    const text = term.field ? entry.fields[term.field] || "" : entry.text;
    const wholeGender =
      !term.field &&
      term.value.length > 1 &&
      ["m", "f", "x"].includes(genders[term.value]);
    const found =
      term.field === "gender" && genders[term.value]
        ? entry.fields.genderCode === genders[term.value]
        : wholeGender
          ? new RegExp(
              "(^|[^\\p{L}\\p{N}])" + term.value + "($|[^\\p{L}\\p{N}])",
              "u",
            ).test(text)
          : text.includes(term.value);
    return term.exclude ? !found : found;
  };
  return index
    .filter((entry) =>
      groups.some((group) => group.every((term) => matches(entry, term))),
    )
    .map((entry) => ({
      entry,
      score:
        groups
          .flat()
          .filter(
            (t) => !t.exclude && normalizeSearch(entry.title).includes(t.value),
          ).length *
          10 +
        (entry.kind === "person" ? 1 : 0),
    }))
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .map(({ entry }) => entry);
}
