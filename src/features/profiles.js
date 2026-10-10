import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { requirements } from "../model/evidence.js";
import { person } from "../model/lookup.js";
import {
  collectCreationLinks,
  creationLinksError,
  creationLinkTargets,
} from "../model/person-creation.js";
import { collectProfile } from "../model/profile-form.js";
import { profileScope } from "../model/profile-scope.js";
import { profileFormError } from "../model/validation.js";
import { commit } from "../services/history.js";
import { openDialog } from "../ui/dialog.js";
import { renderPersonForm } from "../ui/forms/person.js";
import { bindCreationLinks } from "../ui/forms/person-links.js";
import { renderProfileRecord } from "../ui/forms/profile-record.js";
import { renderProfileScopeForm } from "../ui/forms/profile-scope.js";
import { renderProjectForm } from "../ui/forms/project.js";
import { icons } from "../ui/icons.js";
import {
  bindProfileNavigation,
  updateProfileCounts,
} from "../ui/profile-navigation.js";
import { createPerson } from "./person-creation.js";

export async function editPerson(id = null, section = null, addRecord = false) {
  const personId = id || uid();
  const p = id
    ? person(id)
    : {
        name: "",
        birth: "",
        death: "",
        gender: "u",
        aliases: "",
        place: "",
        notes: "",
        requirements: null,
        lifeStatus: "unknown",
        groupIds: appState.groupFilter ? [appState.groupFilter] : [],
      };
  const req =
    p.requirements ??
    requirements({
      ...p,
      id: id || "",
    }).map((t) => t.type);
  const f = await openDialog(
    id ? translate("ui.personProfile") : translate("ui.addPerson"),
    renderPersonForm(
      p,
      req,
      id,
      creationLinkTargets(
        appState.project.people,
        appState.multiSelection,
        appState.selected,
      ),
    ),
    {
      wide: true,
      kind: "person",
      onOpen: () => {
        const editor = $("[data-profile-editor]");
        bindProfileNavigation(editor);
        if (!id) bindCreationLinks(editor);
        if (!section) return;
        const target = $(`#records-${section}`);
        if (addRecord && target)
          target.insertAdjacentHTML("beforeend", renderProfileRecord(section));
        editor.profileJump(section);
        const focus = addRecord ? target?.lastElementChild : target;
        updateProfileCounts();
        icons();
        focus?.scrollIntoView({ block: "start" });
        focus
          ?.querySelector("input:not([type=hidden]),select,textarea")
          ?.focus({ preventScroll: true });
      },
      validate: (f) => {
        if (!f.get("name").trim()) return translate("ui.enterAName");
        const profileError = profileFormError(f, p);
        if (profileError) return profileError;
        if (!id) {
          const error = creationLinksError(f, personId, appState.project);
          if (error) $("[data-profile-editor]").profileJump("basic");
          return error;
        }
        return "";
      },
    },
  );
  if (!f) return;
  const data = {
    name: f.get("name").trim(),
    gender: f.get("gender"),
    lifeStatus: f.get("lifeStatus"),
    birth: String(f.get("birthDate") || ""),
    death: String(f.get("deathDate") || ""),
    place: String(f.get("place") || ""),
    aliases: String(f.get("aliases") || ""),
    notes: String(f.get("notes") || ""),
    requirements: f.getAll("requirements"),
    groupIds: f.getAll("groupIds"),
    ...collectProfile(f, p),
  };
  if (data.death) data.lifeStatus = "deceased";
  if (
    data.nameHistory?.length &&
    !p.nameHistory?.length &&
    !data.requirements.includes("name_change")
  )
    data.requirements.push("name_change");
  if (
    data.lifeStatus === "deceased" &&
    !p.death &&
    p.lifeStatus !== "deceased" &&
    !data.requirements.includes("death")
  )
    data.requirements.push("death");
  if (id) commit(() => Object.assign(p, data));
  else createPerson(data, personId, collectCreationLinks(f, personId));
}
export async function editProject() {
  const f = await openDialog(
    translate("ui.treeInformation"),
    renderProjectForm(appState.project),
  );
  if (f)
    commit(() => {
      appState.project.title =
        f.get("title").trim() || translate("ui.myFamily");
      appState.project.jurisdiction = f.get("jurisdiction");
    });
}

export async function editScope() {
  const visible = profileScope();
  const f = await openDialog(
    translate("ui.whichDataShouldBeShownForThisPurpose"),
    renderProfileScopeForm(appState.project, visible),
  );
  if (f)
    commit(() => {
      appState.project.scopePreferences ??= {};
      appState.project.scopePreferences[appState.project.purpose] =
        f.getAll("sections");
    });
}
