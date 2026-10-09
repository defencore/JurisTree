import { getLocale, translate } from "../i18n/index.js";
export function years(p, { includeUnknown = true } = {}) {
  if (!includeUnknown)
    return [displayDate(p.birth), displayDate(p.death)]
      .filter(Boolean)
      .join(" — ");
  return p.birth || p.death
    ? `${displayDate(p.birth) || "?"}${p.death ? " — " + displayDate(p.death) : p.lifeStatus === "deceased" ? ` ${translate("ui.deathDateUnknown")}` : ""}`
    : translate("ui.datesNotSpecified");
}
export function dateExact(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1 || m < 1 || m > 12 || d < 1) return "";
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);
  return dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
    ? value
    : "";
}
export function displayDate(value) {
  const v = String(value || "");
  if (dateExact(v)) {
    return new Intl.DateTimeFormat(getLocale(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(new Date(utcDay(v) * 86400000));
  }
  return v;
}
export function partialDate(value) {
  const text = String(value || "");
  if (dateExact(text))
    return {
      min: text,
      max: text,
      year: Number(text.slice(0, 4)),
      exact: true,
    };
  if (/^\d{4}$/.test(text) && Number(text) > 0)
    return {
      min: text + "-01-01",
      max: text + "-12-31",
      year: Number(text),
      exact: false,
    };
  return null;
}
export function localDateString(date = new Date()) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function utcDay(value) {
  const date = new Date(0);
  const [year, month, day] = value.split("-").map(Number);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() / 86400000;
}
export function nextAnniversary(value, today = localDateString()) {
  if (!dateExact(value) || !dateExact(today)) return null;
  const [originYear, month, day] = value.split("-").map(Number),
    yearNow = Number(today.slice(0, 4));
  for (
    let year = Math.max(originYear, yearNow);
    year <= Math.max(originYear, yearNow) + 1;
    year++
  ) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0),
      adjusted = month === 2 && day === 29 && !leap,
      dayNow = adjusted ? 28 : day;
    const date =
      String(year).padStart(4, "0") +
      "-" +
      String(month).padStart(2, "0") +
      "-" +
      String(dayNow).padStart(2, "0");
    if (date >= today && date >= value)
      return {
        date,
        days: utcDay(date) - utcDay(today),
        years: year - originYear,
        adjusted,
      };
  }
  return null;
}
export function yearWord(n) {
  const category = new Intl.PluralRules(getLocale()).select(n);
  return translate(
    category === "one"
      ? "ui.year"
      : category === "few"
        ? "ui.years2"
        : "ui.years",
  );
}
