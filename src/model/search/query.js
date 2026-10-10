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
export const genders = Object.fromEntries(
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
