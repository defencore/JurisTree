import { eventCategories } from "../core/config.js";
import { esc } from "../core/dom.js";
import { canRepeatAnnually } from "../core/event-domains.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { partialDate } from "../model/dates.js";
import { person } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { openDialog, toast } from "../ui/dialog.js";
import { renderEventForm } from "../ui/forms/event.js";

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
        if (form.get("date") && !partialDate(form.get("date")))
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
      repeat: canRepeatAnnually(f.get("category")) ? f.get("repeat") : "none",
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
