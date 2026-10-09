import { getLocale } from "../i18n/index.js";
import { normalizeSearch } from "./search.js";

/** Prefer recorded surnames; the basic name field uses given-name–surname order. */
export function personSurname(person) {
  const name = normalizeSearch(person.name);
  const records = (person.nameHistory || [])
    .filter(
      (record) =>
        record.surname?.trim() &&
        (normalizeSearch(record.fullName) === name ||
          (record.kind === "legal" && !record.to && !record.fullName?.trim())),
    )
    .sort((a, b) => String(b.from || "").localeCompare(String(a.from || "")));
  return (
    records[0]?.surname.trim() ||
    String(person.name || "")
      .trim()
      .split(/\s+/)
      .at(-1) ||
    ""
  );
}

export function orderedPeople(people, locale = getLocale()) {
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  });
  return people
    .map((person) => ({ person, surname: personSurname(person) }))
    .sort(
      (a, b) =>
        collator.compare(a.surname, b.surname) ||
        collator.compare(a.person.name, b.person.name) ||
        collator.compare(a.person.id, b.person.id),
    )
    .map(({ person }) => person);
}

export function personNameIndex(person) {
  return normalizeSearch(
    [
      person.name,
      person.aliases,
      ...(person.nameHistory || []).flatMap((record) => [
        record.fullName,
        record.surname,
        record.givenName,
        record.patronymic,
      ]),
    ].join(" "),
  );
}

export function matchesPersonName(index, query) {
  return normalizeSearch(query)
    .split(" ")
    .every((word) => index.includes(word));
}
