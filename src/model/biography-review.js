import { recordConfigs } from "../core/config.js";
import { dateExact, localDateString, partialDate, utcDay } from "./dates.js";

const dayString = (day) => new Date(day * 86400000).toISOString().slice(0, 10);
const recordTitle = (record, config) =>
  record.title ||
  record.organization ||
  record.institution ||
  record.unit ||
  record.name ||
  record.address ||
  [record.country, record.city].filter(Boolean).join(" · ") ||
  record.eventTitle ||
  record.label ||
  config.label;

export function defaultReviewPeriod(person, today = localDateString()) {
  const birth = partialDate(person.birth),
    death = partialDate(person.death);
  const to = death && !death.approximate ? [death.max, today].sort()[0] : today;
  if (!birth || birth.approximate) return { from: "", to };
  const year = Number(birth.max.slice(0, 4)) + 18;
  let adult = String(year).padStart(4, "0") + birth.max.slice(4);
  if (!dateExact(adult)) adult = String(year).padStart(4, "0") + "-02-28";
  return { from: adult <= to ? adult : birth.min, to };
}

/** Inspect recorded periods; never infer behaviour, parentage or a reputation score. */
export function reviewBiography(person, options = {}) {
  const today = options.today || localDateString();
  const period = { ...defaultReviewPeriod(person, today), ...options };
  let { from, to } = period;
  const minimumDays = Number(options.minimumDays ?? 180);
  const mode = options.mode || "all";
  if (
    !dateExact(today) ||
    !dateExact(from) ||
    !dateExact(to) ||
    from > to ||
    !Number.isInteger(minimumDays) ||
    minimumDays < 1 ||
    !["all", "corroborated"].includes(mode)
  )
    throw new RangeError("Invalid biography review period");
  const birth = partialDate(person.birth),
    death = partialDate(person.death);
  if (birth && !birth.approximate && from < birth.min) from = birth.min;
  to = [
    to,
    today,
    ...(death && !death.approximate ? [death.max] : []),
  ].sort()[0];
  if (from > to)
    throw new RangeError("Review period is outside the recorded lifetime");
  const intervals = [],
    incomplete = [],
    pending = [];
  for (const [section, cfg] of Object.entries(recordConfigs())) {
    for (const record of person[cfg.key] || []) {
      const entry = {
        section,
        recordId: record.id,
        title: recordTitle(record, cfg),
        verification: record.verification || "pending",
        sourceId: record.sourceId || "",
      };
      if (
        cfg.fields.some(([key]) => key === "verification") &&
        !["corroborated", "refuted"].includes(entry.verification)
      )
        pending.push(entry);
      const rule = cfg.coverage;
      if (
        !rule ||
        record.verification === "refuted" ||
        (rule.kinds && !rule.kinds.includes(record.kind))
      )
        continue;
      const start = partialDate(record[rule.from]),
        end = partialDate(record[rule.to]);
      const current = Object.entries(rule.current || {}).some(([key, values]) =>
        values.includes(record[key]),
      );
      if (
        !start ||
        (!end && !current) ||
        (start && !start.exact) ||
        (end && !end.exact)
      )
        incomplete.push(entry);
      if (
        !start ||
        (!end && !current) ||
        start.approximate ||
        end?.approximate ||
        (mode === "corroborated" && record.verification !== "corroborated")
      )
        continue;
      const a = Math.max(utcDay(from), utcDay(start.max));
      const b = Math.min(utcDay(to), end ? utcDay(end.min) : utcDay(to));
      if (a <= b)
        intervals.push({
          ...entry,
          from: dayString(a),
          to: dayString(b),
          start: a,
          end: b,
        });
    }
  }
  intervals.sort((a, b) => a.start - b.start || a.end - b.end);
  const coverage = [];
  for (const interval of intervals) {
    const last = coverage.at(-1);
    if (last && interval.start <= last.end + 1) {
      last.end = Math.max(last.end, interval.end);
      last.to = dayString(last.end);
      last.records.push(interval);
    } else
      coverage.push({
        from: interval.from,
        to: interval.to,
        start: interval.start,
        end: interval.end,
        records: [interval],
      });
  }
  const gaps = [];
  let cursor = utcDay(from);
  for (const interval of [
    ...coverage,
    { start: utcDay(to) + 1, end: utcDay(to) },
  ]) {
    const end = interval.start - 1;
    if (end - cursor + 1 >= minimumDays)
      gaps.push({
        from: dayString(cursor),
        to: dayString(end),
        days: end - cursor + 1,
      });
    cursor = Math.max(cursor, interval.end + 1);
  }
  return { from, to, minimumDays, mode, coverage, gaps, incomplete, pending };
}
