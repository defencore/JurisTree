import { state as appState } from "../core/state.js";
import { monthBounds, shiftMonth } from "../model/calendar.js";
import { localDateString } from "../model/dates.js";
import { renderCalendar } from "../ui/workspaces/calendar.js";

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
