import {
  dateExact,
  localDateString,
  nextAnniversary,
  utcDay,
} from "./dates.js";
import { isMilestone } from "../core/event-domains.js";

export function monthBounds(month) {
  if (!/^\d{4}-\d{2}$/.test(month) || !dateExact(month + "-01"))
    throw Error("Invalid calendar month");
  const first = month + "-01";
  let days = 31;
  while (!dateExact(month + "-" + days)) days--;
  return {
    first,
    last: month + "-" + days,
    days,
    weekday: (new Date(utcDay(first) * 86400000).getUTCDay() + 6) % 7,
  };
}
export function shiftMonth(month, delta) {
  monthBounds(month);
  const total =
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1 + delta;
  const year = Math.floor(total / 12),
    value = (total % 12) + 1;
  return year < 1 || year > 9999
    ? month
    : String(year).padStart(4, "0") + "-" + String(value).padStart(2, "0");
}
export function monthOccurrences(
  events,
  month = localDateString().slice(0, 7),
) {
  const { first, last } = monthBounds(month);
  return dateOccurrences(events, first, last);
}
export function yearOccurrences(events, year = localDateString().slice(0, 4)) {
  monthBounds(year + "-01");
  return dateOccurrences(events, year + "-01-01", year + "-12-31");
}
function dateOccurrences(events, first, last) {
  return events
    .flatMap((event) => {
      if (!dateExact(event.date)) return [];
      const next = event.annual
        ? nextAnniversary(event.date, first)
        : { date: event.date, years: 0, days: 0, adjusted: false };
      if (!next || next.date < first || next.date > last) return [];
      next.days = utcDay(next.date) - utcDay(localDateString());
      return [
        {
          ...event,
          next,
          jubilee: isMilestone(event, next.years),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.next.date.localeCompare(b.next.date) || a.id.localeCompare(b.id),
    );
}
