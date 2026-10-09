import { personDisplayName } from "../model/person-display.js";
import { familyEventTypes } from "../core/config.js";
import { esc } from "../core/dom.js";
import { getLocale, translate } from "../i18n/index.js";
import { displayDate, partialDate, utcDay, yearWord } from "../model/dates.js";
import { sourceInScope } from "../model/evidence.js";
import { doc, person } from "../model/lookup.js";
import { avatar } from "./components.js";
import { icon } from "./icons.js";

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
  return `<article class="family-event"><div class="event-date ${upcoming && event.next.days === 0 ? "today" : ""}">${dateMark}</div><div class="event-content"><div class="event-heading"><span class="event-type">${icon(familyEventTypes()[event.type][1])}${familyEventTypes()[event.type][0]}</span><span class="event-relative">${esc(relative)}</span></div><h3>${esc(event.title)}</h3><div class="event-person"><button class="text-person" data-event-person="${p.id}">${avatar(p)}${esc(personDisplayName(p))}</button>${anniversary ? `<span class="event-anniversary">${anniversary}</span>` : ""}${event.jubilee ? `<span class="pill amber">${translate("ui.jubilees")}</span>` : ""}${["pending", "unverified", "refuted", "inconclusive"].includes(event.verification) ? `<span class="pill review">${translate(event.verification === "refuted" ? "ui.refuted" : event.verification === "inconclusive" ? "ui.inconclusive" : "ui.pendingVerification")}</span>` : ""}${!upcoming && event.annual ? `<span class="pill">${translate("ui.everyYear")}</span>` : ""}</div>${event.notes ? `<p class="event-notes">${esc(event.notes)}</p>` : ""}${upcoming && event.next.adjusted ? `<p class="event-adjustment">${translate("ui.february29DateShownOnFebruary28This")}</p>` : ""}${showSource ? `<button class="text-source" data-document="${source.id}">${icon("book")}${esc(source.title)}</button>` : ""}</div><div class="event-actions">${event.section === "timeline" ? `<button class="iconbtn ghost" data-edit-event="${event.recordId}" data-event-owner="${p.id}" title="${translate("ui.editEvent")}" aria-label="${translate("ui.editEvent")} ${esc(event.title)}">${icon("edit")}</button>` : `<button class="iconbtn ghost" ${event.propertyId ? `data-property-history="${event.propertyId}"` : event.relationId ? `data-edit-relation="${event.relationId}"` : event.section ? `data-open-profile-section="${event.section}" data-profile-person="${p.id}"` : `data-edit-person="${p.id}"`} title="${translate("ui.editProfile")}" aria-label="${translate("ui.editProfile")} ${esc(personDisplayName(p))}">${icon("edit")}</button>`}</div></article>`;
}
