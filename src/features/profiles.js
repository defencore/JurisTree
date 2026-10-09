import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { isMobileLayout } from "../core/viewport.js";
import { bounds, fit, focusPerson } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { dateExact } from "../model/dates.js";
import { requirements } from "../model/evidence.js";
import { group, person } from "../model/lookup.js";
import { collectProfile } from "../model/profile-form.js";
import { profileScope } from "../model/profile-scope.js";
import { profileFormError } from "../model/validation.js";
import { commit } from "../services/history.js";
import { openDialog } from "../ui/dialog.js";
import { renderPersonForm } from "../ui/forms/person.js";
import { renderProfileRecord } from "../ui/forms/profile-record.js";
import { renderProfileScopeForm } from "../ui/forms/profile-scope.js";
import { renderProjectForm } from "../ui/forms/project.js";
import { icons } from "../ui/icons.js";
import {
  bindProfileNavigation,
  updateProfileCounts,
} from "../ui/profile-navigation.js";

export async function editPerson(id = null, section = null, addRecord = false) {
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
    renderPersonForm(p, req, id),
    {
      wide: true,
      kind: "person",
      onOpen: () => {
        const editor = $("[data-profile-editor]");
        bindProfileNavigation(editor);
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
        const birth = f.get("birthDate") || f.get("birthYear"),
          death = f.get("deathDate") || f.get("deathYear");
        if (
          birth &&
          death &&
          Number(String(death).slice(0, 4)) < Number(String(birth).slice(0, 4))
        )
          return translate("ui.deathCannotPrecedeBirth");
        if (dateExact(birth) && dateExact(death) && death < birth)
          return translate("ui.deathCannotPrecedeBirth");
        return profileFormError(f, p);
      },
    },
  );
  if (!f) return;
  const data = {
    name: f.get("name").trim(),
    gender: f.get("gender"),
    lifeStatus: f.get("lifeStatus"),
    birth: String(f.get("birthDate") || f.get("birthYear") || ""),
    death: String(f.get("deathDate") || f.get("deathYear") || ""),
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
  commit(() => {
    if (id) Object.assign(p, data);
    else {
      const b = bounds(),
        np = {
          ...data,
          id: uid(),
          avatarId: "",
          x: appState.project.people.length ? b.x + b.w - 15 : 80,
          y: appState.project.people.length ? 240 : 100,
        };
      appState.project.people.push(np);
      if (appState.groupFilter && group(appState.groupFilter))
        group(appState.groupFilter).collapsed = false;
      appState.selected = {
        kind: "person",
        id: np.id,
      };
      if (appState.view === "people") appState.profileFocus = np.id;
    }
  });
  if (!id && appState.view === "tree") isMobileLayout() ? focusPerson() : fit();
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
