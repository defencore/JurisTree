import { renderPersonForm } from "../ui/forms/person.js";
import { defaultScopes, recordConfigs, sectionInfo } from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { safeUrl, uid } from "../core/utils.js";
import { bounds, fit } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { dateExact, displayDate } from "../model/dates.js";
import { requirements } from "../model/evidence.js";
import { group, person } from "../model/project.js";
import { profileFormError } from "../model/validation.js";
import { commit } from "../services/history.js";
import { checks, sourceChips, typeOptions } from "../ui/components.js";
import { openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
export async function editPerson(id = null) {
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
    }
  });
  if (!id) fit();
}
export async function editProject() {
  const f = await openDialog(
    translate("ui.treeInformation"),
    `<label class="field">${translate("ui.title")}<input name="title" value="${esc(appState.project.title)}" required maxlength="150"></label><label class="field">${translate("ui.countryJurisdiction")}<input name="jurisdiction" value="${esc(appState.project.jurisdiction)}" placeholder="${translate("ui.forExampleUsaPennsylvania")}" maxlength="250"><small>${translate("ui.forReferenceOnlyDocumentRequirementsAreNotDetermined")}</small></label>`,
  );
  if (f)
    commit(() => {
      appState.project.title =
        f.get("title").trim() || translate("ui.myFamily");
      appState.project.jurisdiction = f.get("jurisdiction");
    });
}
export function profileScope() {
  const value = appState.project.scopePreferences?.[appState.project.purpose];
  return Array.isArray(value)
    ? value.filter((k) => sectionInfo()[k])
    : defaultScopes[appState.project.purpose] || defaultScopes.family;
}
export async function editScope() {
  const visible = profileScope();
  const f = await openDialog(
    translate("ui.whichDataShouldBeShownForThisPurpose"),
    `<div class="upload-info">${esc(
      {
        family: translate("ui.familyHistory"),
        inheritance: translate("ui.inheritance"),
        property: translate("ui.propertyAllocation"),
        research: translate("ui.relationshipResearch"),
      }[appState.project.purpose],
    )}</div><p class="hint">${translate("ui.peopleFamilyRelationshipsAndDocumentsAreAlwaysAvailable")}</p><div class="check-grid">${Object.entries(
      sectionInfo(),
    )
      .map(
        ([k, [l, ic]]) =>
          `<label><input type="checkbox" name="sections" value="${k}" ${visible.includes(k) ? "checked" : ""}>${icon(ic)}${l}</label>`,
      )
      .join("")}</div>`,
  );
  if (f)
    commit(() => {
      appState.project.scopePreferences ??= {};
      appState.project.scopePreferences[appState.project.purpose] =
        f.getAll("sections");
    });
}
export function recordRow(section, record = {}) {
  const cfg = recordConfigs()[section];
  return `<div class="profile-record" data-record-section="${section}"><div class="record-row-head"><b>${cfg.label}</b><button type="button" class="iconbtn small ghost" data-remove-record aria-label="${translate("ui.deleteRecord")}">${icon("trash")}</button></div><input type="hidden" name="${section}-id" value="${record.id || uid()}"><div class="form-grid">${cfg.fields
    .map(([key, label, type, options]) => {
      const name = section + "-" + key,
        value = record[key] || "";
      const input =
        type === "select"
          ? `<select name="${name}">${typeOptions(options, value || Object.keys(options)[0])}</select>`
          : type === "source"
            ? `<select name="${name}"><option value="">${translate("ui.noSource")}</option>${appState.project.documents.map((d) => `<option value="${d.id}" ${d.id === value ? "selected" : ""}>${esc(d.title)}</option>`).join("")}</select>`
            : type === "textarea"
              ? `<textarea name="${name}" rows="2" maxlength="5000">${esc(value)}</textarea>`
              : `<input name="${name}" type="${type === "date" ? "date" : "text"}" value="${esc(type === "date" ? dateExact(value) : value)}" maxlength="1000" ${type === "period" ? `placeholder="${translate("ui.yearOrYyyyMmDd")}"` : ""}>`;
      return `<label class="field ${["textarea", "source"].includes(type) ? "full" : ""}">${label}${input}</label>`;
    })
    .join("")}</div></div>`;
}
export function profileEditors(p) {
  return profileScope()
    .map((section) => {
      const [label, ic] = sectionInfo()[section];
      let body = "";
      if (recordConfigs()[section]) {
        const cfg = recordConfigs()[section];
        body = `<div id="records-${section}">${(p[cfg.key] || []).map((r) => recordRow(section, r)).join("")}</div><button type="button" class="btn small" data-add-record="${section}">${icon("plus")}${translate("ui.addRecord")}</button>`;
      } else if (section === "biography") {
        body = `<label class="field">${translate("ui.lifeStoryAndHistoricalInformation")}<textarea name="biography" rows="6" maxlength="30000">${esc(p.biography)}</textarea></label><p class="field-caption">${translate("ui.supportingSources")}</p>${checks(appState.project.documents, "bioSourceIds", p.bioSourceIds || [], (d) => d.title)}`;
      } else if (section === "interests") {
        body = `<label class="field">${translate("ui.hobbies")}<textarea name="hobbies" maxlength="5000">${esc(p.hobbies)}</textarea></label><label class="field">${translate("ui.interests")}<textarea name="interests" maxlength="5000">${esc(p.interests)}</textarea></label>`;
      } else
        body = `<label class="field">${translate("ui.healthDetails")}<textarea name="health" rows="4" maxlength="10000">${esc(p.health)}</textarea></label><p class="field-caption">${translate("ui.relatedSources")}</p>${checks(appState.project.documents, "healthSourceIds", p.healthSourceIds || [], (d) => d.title)}`;
      return `<details class="profile-editor-section"><summary>${icon(ic)}${label}<span>${recordConfigs()[section] ? (p[recordConfigs()[section].key] || []).length : ""}</span>${icon("chevron")}</summary><div>${body}</div></details>`;
    })
    .join("");
}
export function collectProfile(form) {
  const data = {};
  for (const section of profileScope()) {
    if (recordConfigs()[section]) {
      const cfg = recordConfigs()[section],
        ids = form.getAll(section + "-id");
      data[cfg.key] = ids
        .map((id, index) => {
          const record = {
            id,
          };
          for (const [key] of cfg.fields)
            record[key] = String(form.getAll(section + "-" + key)[index] || "");
          return record;
        })
        .filter((r) =>
          cfg.fields.some(
            ([key, , type]) =>
              !["select", "source"].includes(type) && r[key].trim(),
          ),
        );
    } else if (section === "biography") {
      data.biography = String(form.get("biography") || "");
      data.bioSourceIds = form.getAll("bioSourceIds");
    } else if (section === "interests") {
      data.hobbies = String(form.get("hobbies") || "");
      data.interests = String(form.get("interests") || "");
    } else {
      data.health = String(form.get("health") || "");
      data.healthSourceIds = form.getAll("healthSourceIds");
    }
  }
  return data;
}
export function recordDetails(section, r) {
  const ic =
    section === "pets"
      ? {
          dog: "dog",
          cat: "cat",
          bird: "bird",
          fish: "fish",
        }[r.type] || "paw"
      : sectionInfo()[section][1];
  const title =
    r.title ||
    r.label ||
    r.address ||
    r.organization ||
    r.name ||
    r.value ||
    translate("ui.record");
  let lines = [];
  if (section === "timeline")
    lines = [
      displayDate(r.date) +
        (r.repeat === "annual" ? ` ${translate("ui.annualAnniversary")}` : ""),
    ];
  else if (section === "contacts") {
    const url = ["social", "website"].includes(r.type)
      ? safeUrl(r.value)
      : r.type === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value)
        ? "mailto:" + r.value
        : r.type === "phone" && /^[+\d\s().-]{3,50}$/.test(r.value)
          ? "tel:" + r.value.replace(/[^+\d]/g, "")
          : "";
    lines = [
      url
        ? `<a href="${esc(url)}" ${url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(r.value)}</a>`
        : esc(r.value),
    ];
  } else if (section === "pets")
    lines = [
      r.birth ? `${translate("ui.birth2")} ` + displayDate(r.birth) : "",
      r.death ? `${translate("ui.death")} ` + displayDate(r.death) : "",
    ];
  else
    lines = [
      r.role || "",
      r.from || r.to
        ? displayDate(r.from) +
          " — " +
          (displayDate(r.to) || translate("ui.present"))
        : "",
      r.location || "",
    ];
  return `<div class="detail-record"><span class="detail-record-icon">${icon(ic)}</span><div><b>${esc(title)}</b>${lines
    .filter(Boolean)
    .map((l) => `<small>${section === "contacts" ? l : esc(l)}</small>`)
    .join(
      "",
    )}${r.notes ? `<p>${esc(r.notes)}</p>` : ""}${r.sourceId ? sourceChips([r.sourceId]) : ""}</div></div>`;
}
export function renderPersonDetails(p) {
  return profileScope()
    .map((section) => {
      const [label, ic] = sectionInfo()[section];
      let body = "";
      if (recordConfigs()[section])
        body = (p[recordConfigs()[section].key] || [])
          .map((r) => recordDetails(section, r))
          .join("");
      else if (section === "biography")
        body =
          (p.biography
            ? `<div class="note-box">${esc(p.biography)}</div>`
            : "") + sourceChips(p.bioSourceIds);
      else if (section === "interests")
        body = [
          [translate("ui.hobbies"), p.hobbies],
          [translate("ui.interests"), p.interests],
        ]
          .filter(([, v]) => v)
          .map(
            ([l, v]) =>
              `<p class="detail-label">${l}</p><div class="note-box">${esc(v)}</div>`,
          )
          .join("");
      else
        body =
          (p.health ? `<div class="note-box">${esc(p.health)}</div>` : "") +
          sourceChips(p.healthSourceIds);
      return `<details class="profile-details" ${section === "timeline" ? "open" : ""}><summary>${icon(ic)}${label}${icon("chevron")}</summary><div>${body || `<p class="kin-empty">${translate("ui.noInformationYet")}</p>`}<button class="btn small ghost" data-edit-person="${p.id}">${icon("edit")}${translate("ui.edit")}</button></div></details>`;
    })
    .join("");
}
