import { translate } from "../i18n/index.js";
import { displayDate, localDateString, yearWord } from "./dates.js";
import { personStatus } from "./person-status.js";

function nameWords(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function recordedMaidenSurname(record, currentName) {
  if (record.surname?.trim()) return record.surname.trim();
  const former = nameWords(record.fullName);
  if (!former.length) return "";
  const parts = [record.givenName, record.patronymic].flatMap(nameWords);
  if (parts.length)
    return former.filter((word) => !parts.includes(word)).join(" ");
  if (former.length === 1) return former[0];
  const current = nameWords(currentName);
  let start = 0,
    end = 0;
  while (
    start < Math.min(former.length, current.length) &&
    former[start] === current[start]
  )
    start++;
  while (
    end < Math.min(former.length, current.length) - start &&
    former.at(-1 - end) === current.at(-1 - end)
  )
    end++;
  return start || end ? former.slice(start, former.length - end).join(" ") : "";
}

/** Only explicit maiden-name records contribute to the display suffix. */
export function maidenSurnames(person) {
  return [
    ...new Set(
      (person?.nameHistory || [])
        .filter((record) => record.kind === "maiden")
        .map((record) => recordedMaidenSurname(record, person.name))
        .filter(Boolean),
    ),
  ];
}

export function personDisplayName(person) {
  if (!person) return "";
  const maiden = maidenSurnames(person);
  return (
    String(person.name || "") + (maiden.length ? ` (${maiden.join(", ")})` : "")
  );
}

export function formatAge(age) {
  if (!age) return "";
  return `${age.min === age.max ? age.min : `${age.min}–${age.max}`} ${yearWord(age.max)}`;
}

export function personLifeDetail(
  person,
  { includeUnknown = true, today = localDateString() } = {},
) {
  const status = personStatus(person, today),
    age = formatAge(status.age);
  if (status.life === "deceased") {
    const date =
      displayDate(person.death) ||
      (includeUnknown ? translate("ui.deathDateUnknown") : "");
    return {
      key: "ui.deathDateLabel",
      value: [date, age ? `(${age})` : ""].filter(Boolean).join(" "),
      age,
      ageKey: "ui.ageAtDeath",
      icon: "candle",
    };
  }
  return {
    key: "ui.currentAge",
    value: status.life === "living" ? age : "",
    age: status.life === "living" ? age : "",
    ageKey: "ui.currentAge",
    icon: "clock",
  };
}

export function personLifeDates(person, options = {}) {
  const birth = displayDate(person.birth),
    detail = personLifeDetail(person, options).value;
  const parts = [
    birth || (detail && options.includeUnknown !== false ? "?" : ""),
    detail,
  ].filter(Boolean);
  return (
    parts.join(" — ") ||
    (options.includeUnknown !== false ? translate("ui.datesNotSpecified") : "")
  );
}
