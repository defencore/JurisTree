import { eventDomains } from "../core/event-domains.js";
import { translate as t } from "../i18n/index.js";
import { typeOptions } from "./components.js";
import { icon } from "./icons.js";

export function eventDomainControl(id, domain) {
  const hint = {
    family: "ui.familyDatesHint",
    biography: "ui.lifeChronologyHint",
    legal: "ui.legalChronologyHint",
    financial: "ui.financialChronologyHint",
  }[domain];
  return `<section class="event-domain-control"><label class="field">${t("ui.eventDomain")}<select id="${id}">${typeOptions(eventDomains(), domain)}</select></label><p>${t(hint)}</p></section>`;
}
export function eventRecordActions(domain, calendar = false) {
  if (domain === "family")
    return `<button class="btn primary" data-action="${calendar ? "add-calendar-event" : "add-event"}">${icon("plus")}${t("ui.addEvent")}</button>`;
  if (domain !== "legal")
    return `<button class="btn primary" data-add-profile-domain="${domain}">${icon("plus")}${t("ui.addRecord")}</button>`;
  const sections = [
    ["legal", "ui.addLegalRecord"],
    ["custody", "ui.addCustodyRecord"],
  ];
  return sections
    .map(
      ([section, label]) =>
        `<button class="btn" data-add-profile-record="${section}">${icon("plus")}${t(label)}</button>`,
    )
    .join("");
}
