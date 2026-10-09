import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { getLocale, translate } from "../i18n/index.js";
import {
  monthBounds,
  monthOccurrences,
  shiftMonth,
  yearOccurrences,
} from "../model/calendar.js";
import { dateExact, displayDate, localDateString } from "../model/dates.js";
import { collectProjectEvents } from "../model/events.js";
import { group, person } from "../model/project.js";
import {
  calendarToolbar,
  calendarFilters,
  monthGrid,
  yearGrid,
} from "../ui/calendar.js";
import { icons } from "../ui/icons.js";
import { eventCard } from "./events.js";
import { eventDomain } from "../core/event-domains.js";
import { eventDomainControl } from "../ui/event-domains.js";

export function changeCalendarMonth(month) {
  try {
    monthBounds(month);
  } catch {
    return;
  }
  appState.calendarMode = "month";
  appState.calendarMonth = month;
  appState.calendarDay = month + "-01";
  renderCalendar();
}
export function changeCalendarYear(value) {
  if (!/^\d{1,4}$/.test(value) || Number(value) < 1 || Number(value) > 9999)
    return;
  appState.calendarMonth =
    String(value).padStart(4, "0") +
    (appState.calendarMonth || localDateString().slice(0, 7)).slice(4);
  appState.calendarDay = appState.calendarMonth + "-01";
  renderCalendar();
}
export function moveCalendarPeriod(delta) {
  const month = appState.calendarMonth || localDateString().slice(0, 7);
  if (appState.calendarMode === "year")
    changeCalendarYear(
      String(Math.max(1, Math.min(9999, Number(month.slice(0, 4)) + delta))),
    );
  else changeCalendarMonth(shiftMonth(month, delta));
}
export function renderCalendar() {
  const today = localDateString(),
    month = appState.calendarMonth || today.slice(0, 7),
    bounds = monthBounds(month),
    mode = appState.calendarMode;
  appState.calendarMonth = month;
  if (
    !appState.calendarDay?.startsWith(month) ||
    !dateExact(appState.calendarDay)
  )
    appState.calendarDay = today.startsWith(month) ? today : bounds.first;
  const query = appState.calendarSearch.toLocaleLowerCase(getLocale());
  const all = collectProjectEvents(appState.project, {
    groupId: appState.groupFilter,
  })
    .filter((e) => eventDomain(e.type) === appState.calendarDomain)
    .filter((e) =>
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
  const occurrences = (
    mode === "year"
      ? yearOccurrences(all, month.slice(0, 4))
      : monthOccurrences(all, month)
  ).filter(
    (e) =>
      !appState.calendarType ||
      (appState.calendarType === "jubilee"
        ? e.jubilee
        : e.type === appState.calendarType),
  );
  const chosen = occurrences.filter(
      (e) => e.next.date === appState.calendarDay,
    ),
    undated = all.filter(
      (e) =>
        !dateExact(e.date) &&
        (!appState.calendarType || e.type === appState.calendarType),
    );
  $("#otherView").innerHTML =
    eventDomainControl("calendarDomain", appState.calendarDomain) +
    calendarToolbar(month, mode) +
    calendarFilters(
      appState.calendarSearch,
      appState.calendarType,
      appState.calendarDomain,
    ) +
    `<p class="hint">${translate("ui.calendarAllSectionsHint")}</p>` +
    (mode === "year"
      ? yearGrid(month.slice(0, 4), occurrences)
      : monthGrid(month, occurrences, appState.calendarDay) +
        `<section class="calendar-agenda" aria-live="polite"><h3>${displayDate(appState.calendarDay)} <span class="pill">${chosen.length}</span></h3>${chosen.map((e) => eventCard(e, true, false)).join("") || `<p class="hint">${translate("ui.noEventsOnDay")}</p>`}</section>`) +
    (undated.length
      ? `<details class="calendar-undated"><summary>${translate("ui.datesWithoutExactDay")} (${undated.length})</summary><p class="hint">${translate("ui.exactCalendarDatesHint")}</p>${undated
          .slice(0, appState.calendarUndatedLimit)
          .map(
            (e) =>
              `<p><button type="button" class="text-person" data-edit-person="${e.personId}">${esc(person(e.personId)?.name)}</button> · ${esc(e.title)} · ${esc(e.date)}</p>`,
          )
          .join(
            "",
          )}${undated.length > appState.calendarUndatedLimit ? `<button type="button" class="btn" data-action="more-calendar-dates">${translate("ui.show80More")} · ${appState.calendarUndatedLimit}/${undated.length}</button>` : ""}</details>`
      : "");
  icons();
}
