import { familyEventTypes } from "../core/config.js";
import { esc } from "../core/dom.js";
import { eventTypesInDomain } from "../core/event-domains.js";
import { getLocale, translate } from "../i18n/index.js";
import { monthBounds } from "../model/calendar.js";
import { displayDate, localDateString, utcDay } from "../model/dates.js";
import { person } from "../model/lookup.js";
import { typeOptions } from "./components.js";
import { icon } from "./icons.js";

function monthTitle(month) {
  return new Intl.DateTimeFormat(getLocale(), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(utcDay(month + "-01") * 86400000));
}
function weekdays() {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(getLocale(), {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date((utcDay("2024-01-01") + i) * 86400000)),
  );
}
export function calendarToolbar(month, mode) {
  const year = mode === "year";
  return `<div class="calendar-toolbar"><div class="calendar-navigation"><button type="button" class="iconbtn" data-action="calendar-previous" aria-label="${translate(year ? "ui.previousYear" : "ui.previousMonth")}">${icon("chevronLeft")}</button><h2>${esc(year ? month.slice(0, 4) : monthTitle(month))}</h2><button type="button" class="iconbtn" data-action="calendar-next" aria-label="${translate(year ? "ui.nextYear" : "ui.nextMonth")}">${icon("chevronRight")}</button></div><div class="calendar-mode"><button type="button" class="btn ${!year ? "active" : ""}" data-calendar-mode="month" aria-pressed="${!year}">${translate("ui.monthView")}</button><button type="button" class="btn ${year ? "active" : ""}" data-calendar-mode="year" aria-pressed="${year}">${translate("ui.yearView")}</button></div><button type="button" class="btn" data-action="calendar-today">${translate("ui.today")}</button>${year ? `<input type="number" id="calendarYear" min="1" max="9999" step="1" value="${month.slice(0, 4)}" aria-label="${translate("ui.calendarYear")}">` : `<input type="month" id="calendarMonth" value="${month}" aria-label="${translate("ui.calendarMonth")}">`}</div>`;
}
export function calendarFilters(query, type, domain) {
  return `<div class="calendar-filters"><div class="search">${icon("search")}<input id="calendarSearch" value="${esc(query)}" placeholder="${translate("ui.personFamilyOrEvent")}" aria-label="${translate("ui.searchCalendar")}"></div><select id="calendarType" aria-label="${translate("ui.eventType")}"><option value="">${translate("ui.allEventTypes")}</option>${typeOptions(Object.fromEntries(Object.entries(eventTypesInDomain(familyEventTypes(), domain)).map(([key, [label]]) => [key, label])), type)}</select></div>`;
}
export function monthGrid(month, occurrences, selected = "", mini = false) {
  const bounds = monthBounds(month),
    today = localDateString();
  const dates = new Map();
  for (const e of occurrences) {
    const list = dates.get(e.next.date) || [];
    list.push(e);
    dates.set(e.next.date, list);
  }
  const cells = Array.from(
    { length: bounds.weekday },
    () =>
      `<${mini ? "span" : "div"} class="calendar-blank" aria-hidden="true"></${mini ? "span" : "div"}>`,
  );
  for (let day = 1; day <= bounds.days; day++) {
    const date = month + "-" + String(day).padStart(2, "0"),
      entries = dates.get(date) || [];
    if (mini) {
      cells.push(
        `<span class="mini-calendar-day ${entries.length ? "has-events" : ""} ${entries.some((e) => e.jubilee) ? "jubilee" : ""} ${date === today ? "today" : ""}">${day}</span>`,
      );
      continue;
    }
    cells.push(
      `<button type="button" class="calendar-day ${date === today ? "today" : ""} ${date === selected ? "selected" : ""}" data-calendar-day="${date}" aria-pressed="${date === selected}" aria-label="${esc(displayDate(date) + ", " + entries.length + " " + translate("ui.calendarEvents"))}"><span class="calendar-day-number">${day}${entries.length ? `<small>${entries.length}</small>` : ""}</span><span class="calendar-day-entries">${entries
        .slice(0, 3)
        .map(
          (e) =>
            `<span class="calendar-entry ${e.jubilee ? "jubilee" : ""}">${icon(familyEventTypes()[e.type]?.[1] || "calendarClock")}${esc(e.type === "birth" ? person(e.personId)?.name : e.title)}</span>`,
        )
        .join(
          "",
        )}${entries.length > 3 ? `<small>+${entries.length - 3}</small>` : ""}</span><span class="calendar-dots" aria-hidden="true">${entries
        .slice(0, 3)
        .map((e) => `<i class="${e.jubilee ? "jubilee" : ""}"></i>`)
        .join("")}</span></button>`,
    );
  }
  return `<div class="${mini ? "mini-calendar-grid" : "calendar-grid"}" ${mini ? 'aria-hidden="true"' : `role="group" aria-label="${translate("ui.calendar")}"`}>${weekdays()
    .map(
      (d) =>
        `<span class="calendar-weekday">${esc(mini ? d.slice(0, 2) : d)}</span>`,
    )
    .join("")}${cells.join("")}</div>`;
}
export function yearGrid(year, occurrences) {
  return `<div class="calendar-year-grid">${Array.from(
    { length: 12 },
    (_, index) => {
      const month = year + "-" + String(index + 1).padStart(2, "0"),
        events = occurrences.filter((e) => e.next.date.startsWith(month));
      return `<button type="button" class="calendar-month" data-calendar-open-month="${month}" aria-label="${esc(translate("ui.openCalendarMonth") + ": " + monthTitle(month) + ", " + events.length + " " + translate("ui.calendarEvents"))}"><span class="calendar-month-title"><strong>${esc(monthTitle(month))}</strong><small class="pill">${events.length}</small></span>${monthGrid(month, events, "", true)}</button>`;
    },
  ).join("")}</div>`;
}
