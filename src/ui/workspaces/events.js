import { $ } from "../../core/dom.js";
import { eventDomain } from "../../core/event-domains.js";
import { state as appState } from "../../core/state.js";
import { getLocale, translate } from "../../i18n/index.js";
import { localDateString, partialDate } from "../../model/dates.js";
import { familyEvents, upcomingEvents } from "../../model/events.js";
import { group, person } from "../../model/lookup.js";
import { eventCard } from "../event-card.js";
import { eventRecordActions } from "../event-domains.js";
import { eventListControls } from "../event-list.js";
import { icon, icons } from "../icons.js";

export function renderEvents() {
  const all = familyEvents().filter(
      (event) => eventDomain(event.type) === appState.eventDomain,
    ),
    today = localDateString(),
    q = appState.eventSearch.toLocaleLowerCase(getLocale()),
    matching = all.filter(
      (e) =>
        (!appState.eventType || e.type === appState.eventType) &&
        [
          e.title,
          e.notes,
          person(e.personId)?.name,
          ...(person(e.personId)?.groupIds || []).map((id) => group(id)?.name),
        ]
          .join(" ")
          .toLocaleLowerCase(getLocale())
          .includes(q),
    );
  const upcoming = upcomingEvents(matching, today, appState.eventDays);
  const chronology = [...matching].sort((a, b) => {
    const da = partialDate(a.date),
      db = partialDate(b.date);
    if (!da || !db)
      return da ? -1 : db ? 1 : a.title.localeCompare(b.title, getLocale());
    return (
      da.min.localeCompare(db.min) * (appState.eventOrder === "asc" ? 1 : -1) ||
      a.title.localeCompare(b.title, getLocale())
    );
  });
  const records = appState.eventMode === "upcoming" ? upcoming : chronology,
    shown = records.slice(0, appState.eventLimit);
  let lastYear = "";
  const entries = shown
    .map((e) => {
      const year = partialDate(e.date)?.year || translate("ui.noExactDate"),
        heading =
          appState.eventMode === "history" && lastYear !== year
            ? `<h2 class="event-year-heading">${year}</h2>`
            : "";
      lastYear = year;
      return heading + eventCard(e, appState.eventMode === "upcoming");
    })
    .join("");
  $("#otherView").innerHTML =
    eventListControls(today, matching, upcoming) +
    `<div class="family-event-list">${entries || `<div class="empty">${icon("calendarClock")}<h2>${appState.eventMode === "upcoming" ? translate("ui.noEventsInThisPeriod") : translate("ui.noEventsYet")}</h2><p>${appState.eventMode === "upcoming" ? translate(appState.eventDomain === "family" ? "ui.anniversariesNeedAnExactDateDayMonthAnd" : "ui.noUpcomingRecordsHint") : translate("ui.addBirthDatesEventsAddressesOrWorkDetails")}</p>${appState.project.people.length ? eventRecordActions(appState.eventDomain) : ""}</div>`}</div>${records.length > shown.length ? `<div class="events-more"><span>${translate("ui.showing")} ${shown.length} ${translate("ui.of")} ${records.length}</span><button class="btn" data-action="more-events">${translate("ui.show80More")}</button></div>` : ""}`;
  icons();
}
