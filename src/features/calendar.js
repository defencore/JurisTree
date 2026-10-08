import { $, esc } from "../core/dom.js";
import { familyEventTypes } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { getLocale, translate } from "../i18n/index.js";
import {
  monthBounds,
  monthOccurrences,
  shiftMonth,
} from "../model/calendar.js";
import {
  dateExact,
  displayDate,
  localDateString,
  utcDay,
} from "../model/dates.js";
import { collectProjectEvents } from "../model/events.js";
import { group, person } from "../model/project.js";
import { typeOptions } from "../ui/components.js";
import { icon, icons } from "../ui/icons.js";
import { eventCard } from "./events.js";

export function changeCalendarMonth(month) {
  try {
    monthBounds(month);
  } catch {
    return;
  }
  appState.calendarMonth = month;
  appState.calendarDay = month + "-01";
  renderCalendar();
}
export function moveCalendarMonth(delta) {
  changeCalendarMonth(
    shiftMonth(appState.calendarMonth || localDateString().slice(0, 7), delta),
  );
}
export function renderCalendar() {
  const today = localDateString(),
    month = appState.calendarMonth || today.slice(0, 7),
    bounds = monthBounds(month);
  appState.calendarMonth = month;
  if (
    !appState.calendarDay?.startsWith(month) ||
    !dateExact(appState.calendarDay)
  )
    appState.calendarDay = today.startsWith(month) ? today : bounds.first;
  const query = appState.calendarSearch.toLocaleLowerCase(getLocale());
  const all = collectProjectEvents(appState.project, {
    groupId: appState.groupFilter,
  }).filter((e) =>
    [
      e.title,
      e.notes,
      person(e.personId)?.name,
      ...(person(e.personId)?.groupIds || []).map((id) => group(id)?.name),
    ]
      .join(" ")
      .toLocaleLowerCase(getLocale())
      .includes(query),
  );
  const occurrences = monthOccurrences(all, month).filter(
    (e) =>
      !appState.calendarType ||
      (appState.calendarType === "jubilee"
        ? e.jubilee
        : e.type === appState.calendarType),
  );
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(getLocale(), {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date((utcDay("2024-01-01") + i) * 86400000)),
  );
  const cells = Array.from(
    { length: bounds.weekday },
    () => '<div class="calendar-blank" aria-hidden="true"></div>',
  );
  for (let day = 1; day <= bounds.days; day++) {
    const date = month + "-" + String(day).padStart(2, "0"),
      entries = occurrences.filter((e) => e.next.date === date);
    cells.push(
      `<button type="button" class="calendar-day ${date === today ? "today" : ""} ${date === appState.calendarDay ? "selected" : ""}" data-calendar-day="${date}" aria-pressed="${date === appState.calendarDay}" aria-label="${esc(displayDate(date) + ", " + entries.length + " " + translate("ui.calendarEvents"))}"><span class="calendar-day-number">${day}${entries.length ? `<small>${entries.length}</small>` : ""}</span><span class="calendar-day-entries">${entries
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
  const chosen = occurrences.filter(
    (e) => e.next.date === appState.calendarDay,
  );
  const undated = all.filter((e) => !dateExact(e.date));
  $("#otherView").innerHTML =
    `<div class="calendar-toolbar"><div class="calendar-navigation"><button type="button" class="iconbtn" data-action="calendar-previous" aria-label="${translate("ui.previousMonth")}">${icon("chevronLeft")}</button><h2>${esc(new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(utcDay(bounds.first) * 86400000)))}</h2><button type="button" class="iconbtn" data-action="calendar-next" aria-label="${translate("ui.nextMonth")}">${icon("chevronRight")}</button></div><button type="button" class="btn" data-action="calendar-today">${translate("ui.today")}</button><input type="month" id="calendarMonth" value="${month}" aria-label="${translate("ui.calendarMonth")}"></div><div class="calendar-filters"><div class="search">${icon("search")}<input id="calendarSearch" value="${esc(appState.calendarSearch)}" placeholder="${translate("ui.personFamilyOrEvent")}" aria-label="${translate("ui.searchCalendar")}"></div><select id="calendarType" aria-label="${translate("ui.eventType")}"><option value="">${translate("ui.allEventTypes")}</option>${typeOptions(Object.fromEntries(Object.entries(familyEventTypes()).map(([key, [label]]) => [key, label])), appState.calendarType)}</select></div><p class="hint">${translate("ui.calendarAllSectionsHint")}</p><div class="calendar-grid" role="group" aria-label="${translate("ui.calendar")}">${weekdays.map((day) => `<div class="calendar-weekday">${esc(day)}</div>`).join("")}${cells.join("")}</div><section class="calendar-agenda" aria-live="polite"><h3>${displayDate(appState.calendarDay)} <span class="pill">${chosen.length}</span></h3>${chosen.map((e) => eventCard(e, true, false)).join("") || `<p class="hint">${translate("ui.noEventsOnDay")}</p>`}</section>${
      undated.length
        ? `<details class="calendar-undated"><summary>${translate("ui.datesWithoutExactDay")} (${undated.length})</summary><p class="hint">${translate("ui.exactCalendarDatesHint")}</p>${undated
            .slice(0, 30)
            .map(
              (e) =>
                `<p><button type="button" class="text-person" data-edit-person="${e.personId}">${esc(person(e.personId)?.name)}</button> · ${esc(e.title)} · ${esc(e.date)}</p>`,
            )
            .join("")}</details>`
        : ""
    }`;
  icons();
}
