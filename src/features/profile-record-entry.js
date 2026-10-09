import { recordConfigs, sectionInfo } from "../core/config.js";
import { eventDomain } from "../core/event-domains.js";
import { orderedProfileSections } from "../core/profile-groups.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { person } from "../model/lookup.js";
import { personOptions, typeOptions } from "../ui/components.js";
import { openDialog, toast } from "../ui/dialog.js";
import { editPerson } from "./profiles.js";

export async function addProfileRecord(section, domain = null) {
  const configs = recordConfigs();
  section ??= { biography: "education", financial: "assets" }[domain];
  const sections = domain
    ? orderedProfileSections().filter(
        (key) =>
          configs[key] &&
          eventDomain(
            configs[key].calendar?.type ||
              (key === "occupations" ? "occupation" : key),
          ) === domain,
      )
    : [section];
  if (!sections.length || sections.some((key) => !configs[key])) return;
  if (!state.project.people.length)
    return toast(t("ui.addAPersonToTheTreeFirst"));
  const selected =
    state.selected?.kind === "person"
      ? state.selected.id
      : state.project.people[0].id;
  const form = await openDialog(
    t("ui.chooseRecordPerson"),
    `<label class="field">${t("ui.person")}<select name="recordPerson">${personOptions(selected)}</select></label>${domain ? `<label class="field">${t("ui.recordSection")}<select name="recordSection">${typeOptions(Object.fromEntries(sections.map((key) => [key, sectionInfo()[key][0]])), sections.includes(section) ? section : sections[0])}</select></label>` : ""}`,
    {
      submit: t("ui.openProfileSection"),
      validate: (form) =>
        person(form.get("recordPerson")) ? "" : t("ui.selectAPerson"),
    },
  );
  const target = domain ? form?.get("recordSection") : section;
  if (form && sections.includes(target))
    await editPerson(form.get("recordPerson"), target, true);
}
