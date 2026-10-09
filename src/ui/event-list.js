import { familyEventTypes } from "../core/config.js";
import { esc } from "../core/dom.js";
import { eventTypesInDomain } from "../core/event-domains.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
import { group } from "../model/project.js";
import { typeOptions } from "./components.js";
import { eventDomainControl } from "./event-domains.js";
import { icon } from "./icons.js";

export function eventListControls(today, matching, upcoming) {
  const types = eventTypesInDomain(familyEventTypes(), state.eventDomain);
  return (
    eventDomainControl("eventDomain", state.eventDomain) +
    `<div class="events-overview"><div><span class="overview-label">${t("ui.today")}</span><b>${displayDate(today)}</b><small>${state.groupFilter ? esc(group(state.groupFilter)?.name) : t("ui.wholeFamily")}</small></div><div><span class="overview-label">${t("ui.eventsInSelection")}</span><b>${matching.length}</b><small>${t("ui.datedRecords")}</small></div><div><span class="overview-label">${t("ui.next")} ${state.eventDays} ${t("ui.days")}</span><b>${upcoming.length}</b><small>${t("ui.datedRecords")}</small></div></div>
    <div class="events-controls"><div class="event-tabs" role="tablist" aria-label="${t("ui.eventView")}"><button role="tab" aria-selected="${state.eventMode === "upcoming"}" class="${state.eventMode === "upcoming" ? "active" : ""}" data-event-mode="upcoming">${icon("calendarClock")}${t("ui.next")}</button><button role="tab" aria-selected="${state.eventMode === "history"}" class="${state.eventMode === "history" ? "active" : ""}" data-event-mode="history">${icon("history")}${t("ui.timeline")}</button></div>
    <div class="events-filters"><div class="search">${icon("search")}<input id="eventSearch" value="${esc(state.eventSearch)}" placeholder="${t("ui.personFamilyOrEvent")}" aria-label="${t("ui.searchEvents")}"></div><select id="eventType" aria-label="${t("ui.eventType")}"><option value="">${t("ui.allEventTypes")}</option>${typeOptions(Object.fromEntries(Object.entries(types).map(([key, [label]]) => [key, label])), state.eventType)}</select>${state.eventMode === "upcoming" ? `<select id="eventDays" aria-label="${t("ui.upcomingPeriod")}">${[30, 90, 365].map((n) => `<option value="${n}" ${n === state.eventDays ? "selected" : ""}>${n} ${t("ui.days")}</option>`).join("")}</select>` : `<select id="eventOrder" aria-label="${t("ui.timelineOrder")}"><option value="desc" ${state.eventOrder === "desc" ? "selected" : ""}>${t("ui.newestFirst")}</option><option value="asc" ${state.eventOrder === "asc" ? "selected" : ""}>${t("ui.oldestFirst")}</option></select>`}</div></div>`
  );
}
