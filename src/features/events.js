import { collectProjectEvents } from "../model/events.js";
import { eventCategories } from "../core/config.js";
import { renderEventForm } from "../ui/forms/event.js";
import { getLocale } from "../i18n/index.js";
import { familyEventTypes } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { profileScope } from "./profiles.js";
import { translate } from "../i18n/index.js";
import {
  dateExact,
  displayDate,
  localDateString,
  nextAnniversary,
  partialDate,
  utcDay,
  yearWord,
} from "../model/dates.js";
import { sourceInScope } from "../model/evidence.js";
import { doc, group, person } from "../model/project.js";
import { commit } from "../services/history.js";
import { avatar, typeOptions } from "../ui/components.js";
import { openDialog, toast } from "../ui/dialog.js";
import { icon, icons } from "../ui/icons.js";
export function familyEvents() {
  return collectProjectEvents(appState.project, {
    sections: profileScope(),
    groupId: appState.groupFilter,
  });
}
export function upcomingEvents(events, today = localDateString(), days = 90) {
  return events
    .flatMap((event) => {
      let next = event.annual
        ? nextAnniversary(event.date, today)
        : dateExact(event.date) && event.date >= today
          ? {
              date: event.date,
              days: utcDay(event.date) - utcDay(today),
              years: 0,
              adjusted: false,
            }
          : null;
      return next && next.days <= days
        ? [
            {
              ...event,
              next,
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        a.next.days - b.next.days ||
        a.title.localeCompare(b.title, getLocale()),
    );
}
export function eventCard(event, upcoming = false, showRelative = true) {
  const p = person(event.personId),
    source = doc(event.sourceId),
    showSource = source && sourceInScope(source),
    date = upcoming ? event.next.date : event.date,
    info = partialDate(date),
    month = info?.exact
      ? new Intl.DateTimeFormat(getLocale(), {
          month: "short",
          timeZone: "UTC",
        }).format(new Date(utcDay(date) * 86400000))
      : "";
  const dateMark = info?.exact
    ? `<b>${Number(date.slice(8))}</b><small>${esc(month)}</small><span>${date.slice(0, 4)}</span>`
    : `<b class="date-year">${info?.year || "—"}</b><small>${info ? translate("ui.yearOnly") : translate("ui.noDate")}</small>`;
  const relative =
    upcoming && showRelative
      ? event.next.days === 0
        ? translate("ui.today")
        : event.next.days === 1
          ? translate("ui.tomorrow")
          : `${translate("ui.in")} ` + event.next.days + ` ${translate("ui.d")}`
      : info
        ? displayDate(date)
        : date || translate("ui.dateUnknown");
  const anniversary =
    upcoming && event.annual && event.next.years > 0
      ? event.next.years +
        " " +
        yearWord(event.next.years) +
        (event.type === "birth" && !p.death && p.lifeStatus !== "deceased"
          ? ""
          : ` ${translate("ui.sinceEvent")}`)
      : "";
  return `<article class="family-event"><div class="event-date ${upcoming && event.next.days === 0 ? "today" : ""}">${dateMark}</div><div class="event-content"><div class="event-heading"><span class="event-type">${icon(familyEventTypes()[event.type][1])}${familyEventTypes()[event.type][0]}</span><span class="event-relative">${esc(relative)}</span></div><h3>${esc(event.title)}</h3><div class="event-person"><button class="text-person" data-event-person="${p.id}">${avatar(p)}${esc(p.name)}</button>${anniversary ? `<span class="event-anniversary">${anniversary}</span>` : ""}${event.jubilee ? `<span class="pill amber">${translate("ui.jubilees")}</span>` : ""}${["pending", "unverified", "refuted", "inconclusive"].includes(event.verification) ? `<span class="pill review">${translate(event.verification === "refuted" ? "ui.refuted" : event.verification === "inconclusive" ? "ui.inconclusive" : "ui.pendingVerification")}</span>` : ""}${!upcoming && event.annual ? `<span class="pill">${translate("ui.everyYear")}</span>` : ""}</div>${event.notes ? `<p class="event-notes">${esc(event.notes)}</p>` : ""}${upcoming && event.next.adjusted ? `<p class="event-adjustment">${translate("ui.february29DateShownOnFebruary28This")}</p>` : ""}${showSource ? `<button class="text-source" data-document="${source.id}">${icon("book")}${esc(source.title)}</button>` : ""}</div><div class="event-actions">${event.section === "timeline" ? `<button class="iconbtn ghost" data-edit-event="${event.recordId}" data-event-owner="${p.id}" title="${translate("ui.editEvent")}" aria-label="${translate("ui.editEvent")} ${esc(event.title)}">${icon("edit")}</button>` : `<button class="iconbtn ghost" ${event.relationId ? `data-edit-relation="${event.relationId}"` : `data-edit-person="${p.id}"`} title="${translate("ui.editProfile")}" aria-label="${translate("ui.editProfile")} ${esc(p.name)}">${icon("edit")}</button>`}</div></article>`;
}
export function renderEvents() {
  const all = familyEvents(),
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
    `<div class="events-overview"><div><span class="overview-label">${translate("ui.today")}</span><b>${displayDate(today)}</b><small>${appState.groupFilter ? esc(group(appState.groupFilter)?.name) : translate("ui.wholeFamily")}</small></div><div><span class="overview-label">${translate("ui.eventsInSelection")}</span><b>${matching.length}</b><small>${translate("ui.fromVisibleProfileSections")}</small></div><div><span class="overview-label">${translate("ui.next")} ${appState.eventDays} ${translate("ui.days")}</span><b>${upcoming.length}</b><small>${translate("ui.birthdaysAnniversariesAndEvents")}</small></div></div><div class="events-controls"><div class="event-tabs" role="tablist" aria-label="${translate("ui.eventView")}"><button role="tab" aria-selected="${appState.eventMode === "upcoming"}" class="${appState.eventMode === "upcoming" ? "active" : ""}" data-event-mode="upcoming">${icon("calendarClock")}${translate("ui.next")}</button><button role="tab" aria-selected="${appState.eventMode === "history"}" class="${appState.eventMode === "history" ? "active" : ""}" data-event-mode="history">${icon("history")}${translate("ui.timeline")}</button></div><div class="events-filters"><div class="search">${icon("search")}<input id="eventSearch" value="${esc(appState.eventSearch)}" placeholder="${translate("ui.personFamilyOrEvent")}" aria-label="${translate("ui.searchEvents")}"></div><select id="eventType" aria-label="${translate("ui.eventType")}"><option value="">${translate("ui.allEventTypes")}</option>${typeOptions(Object.fromEntries(Object.entries(familyEventTypes()).map(([k, [label]]) => [k, label])), appState.eventType)}</select>${appState.eventMode === "upcoming" ? `<select id="eventDays" aria-label="${translate("ui.upcomingPeriod")}">${[30, 90, 365].map((n) => `<option value="${n}" ${n === appState.eventDays ? "selected" : ""}>${n} ${translate("ui.days")}</option>`).join("")}</select>` : `<select id="eventOrder" aria-label="${translate("ui.timelineOrder")}"><option value="desc" ${appState.eventOrder === "desc" ? "selected" : ""}>${translate("ui.newestFirst")}</option><option value="asc" ${appState.eventOrder === "asc" ? "selected" : ""}>${translate("ui.oldestFirst")}</option></select>`}</div></div>${!profileScope().includes("timeline") ? `<div class="event-scope-note">${icon("sliders")}<span>${translate("ui.personalEventsAreHiddenForThisPurposeDates")}</span><button class="btn small ghost" data-action="scope">${translate("ui.configureSections")}</button></div>` : ""}<div class="family-event-list">${entries || `<div class="empty">${icon("calendarClock")}<h2>${appState.eventMode === "upcoming" ? translate("ui.noEventsInThisPeriod") : translate("ui.noEventsYet")}</h2><p>${appState.eventMode === "upcoming" ? translate("ui.anniversariesNeedAnExactDateDayMonthAnd") : translate("ui.addBirthDatesEventsAddressesOrWorkDetails")}</p>${profileScope().includes("timeline") && appState.project.people.length ? `<button class="btn primary" data-action="add-event">${translate("ui.addEvent")}</button>` : ""}</div>`}</div>${records.length > shown.length ? `<div class="events-more"><span>${translate("ui.showing")} ${shown.length} ${translate("ui.of")} ${records.length}</span><button class="btn" data-action="more-events">${translate("ui.show80More")}</button></div>` : ""}`;
  icons();
}
export async function editFamilyEvent(
  personId = null,
  eventId = null,
  date = "",
) {
  if (!appState.project.people.length) {
    toast(translate("ui.addAPersonToTheTreeFirst"));
    return;
  }
  const owner =
      person(personId || appState.selected?.id) || appState.project.people[0],
    old = eventId
      ? owner.events?.find((e) => e.id === eventId)
      : {
          title: "",
          date,
          category: "custom",
          repeat: "annual",
          notes: "",
          sourceId: "",
        };
  if (!old) return;
  const f = await openDialog(
    eventId ? translate("ui.editEvent") : translate("ui.addEvent"),
    renderEventForm(eventId, owner, old),
    {
      validate: (form) => {
        if (!form.get("title")?.trim())
          return translate("ui.enterAnEventTitle");
        if (form.get("date") && !dateExact(form.get("date")))
          return translate("ui.enterAValidDate2");
        const target = eventId ? owner : person(form.get("personId"));
        if (!target) return translate("ui.selectAPerson");
        if (!eventId && (target.events || []).length >= 200)
          return translate("ui.aProfileSupportsUpTo200Events");
        return "";
      },
    },
  );
  if (!f) return;
  const target = eventId ? owner : person(f.get("personId")),
    record = {
      id: eventId || uid(),
      title: f.get("title").trim(),
      date: String(f.get("date") || ""),
      repeat: f.get("repeat"),
      category: Object.hasOwn(eventCategories(), f.get("category"))
        ? f.get("category")
        : "custom",
      notes: String(f.get("notes") || ""),
      sourceId: String(f.get("sourceId") || ""),
    };
  commit(() => {
    target.events ??= [];
    if (eventId) Object.assign(old, record);
    else target.events.push(record);
  });
}
export async function deleteFamilyEvent(personId, eventId) {
  const p = person(personId),
    event = p?.events?.find((e) => e.id === eventId);
  if (!event) return;
  const f = await openDialog(
    translate("ui.deleteEvent2"),
    `<p>${esc(event.title)} · ${esc(p.name)}</p>`,
    {
      submit: translate("ui.delete"),
    },
  );
  if (f)
    commit(() => {
      p.events = p.events.filter((e) => e.id !== eventId);
    });
}
