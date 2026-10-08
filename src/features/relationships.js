import {
  collectRelationship,
  duplicateRelationship,
  relationshipConfig,
} from "../core/relationships.js";
import { profileRecordError } from "../model/profile-records.js";
import {
  renderRelationshipForm,
  bindRelationshipForm,
} from "../ui/forms/relationship.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { kinshipBetween } from "../model/kinship.js";
import { person, relation } from "../model/project.js";
import { isParentCycle } from "../model/validation.js";
import { commit } from "../services/history.js";
import { avatar, personOptions } from "../ui/components.js";
import { openDialog, toast } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
export async function editRelation(id = null, context = {}) {
  if (appState.project.people.length < 2) {
    toast(translate("ui.addAtLeastTwoPeopleFirst"));
    return;
  }
  const from =
    context.from ||
    (appState.selected?.kind === "person"
      ? appState.selected.id
      : appState.project.people[0].id);
  const r = id
    ? relation(id)
    : {
        from,
        to:
          context.to ||
          appState.project.people.find((p) => p.id !== from)?.id ||
          appState.project.people[1].id,
        type: context.type || "parent",
        notes: "",
        disputed: false,
      };
  const f = await openDialog(
    id ? translate("ui.editRelationship") : translate("ui.addRelationship"),
    renderRelationshipForm(r, id),
    {
      wide: true,
      onOpen: bindRelationshipForm,
      validate: (f) => {
        const a = f.get("from"),
          b = f.get("to"),
          t = f.get("type");
        if (a === b) return translate("ui.selectTwoDifferentPeople");
        if (
          ["parent", "adopted", "step_parent"].includes(t) &&
          isParentCycle(a, b, id)
        )
          return translate("ui.thisWouldCreateAGenerationCycleCheckThe");
        const details = collectRelationship(f);
        const error = profileRecordError(relationshipConfig(), details);
        if (error) return error;
        if (
          duplicateRelationship(
            appState.project.relations,
            { from: a, to: b, type: t, ...details },
            id,
          )
        )
          return translate("ui.thisRelationshipAlreadyExists");
        return "";
      },
    },
  );
  if (!f) return;
  commit(() => {
    const data = {
      from: f.get("from"),
      to: f.get("to"),
      type: f.get("type"),
      notes: f.get("notes"),
      disputed: f.has("disputed"),
      ...collectRelationship(f),
    };
    if (id) Object.assign(r, data);
    else {
      const nr = {
        id: uid(),
        ...data,
      };
      appState.project.relations.push(nr);
      appState.selected = {
        kind: "relation",
        id: nr.id,
      };
    }
  });
}
export function kinPathMarkup(path) {
  if (!path) return "";
  return path.people
    .map(
      (id, i) =>
        `<div class="kin-path-item">${avatar(person(id))}<span><b>${esc(person(id)?.name)}</b><small>${i === 0 ? translate("ui.selectedPerson") : i + ` ${translate("ui.generationsAbove")}`}</small></span></div>`,
    )
    .join("");
}
export function renderKinResult() {
  const a = $("#kinFrom")?.value,
    b = $("#kinTo")?.value,
    k = kinshipBetween(a, b);
  appState.currentKinResult = {
    ...k,
    from: a,
    to: b,
  };
  const source = "https://www.familysearch.org/en/blog/cousin-chart";
  $("#kinResult").innerHTML =
    `<section class="kin-result"><span class="result-symbol">${icon(k.found ? "network" : "help")}</span><p class="eyebrow">${esc(person(b)?.name || translate("ui.secondPerson"))} ${translate("ui.for")} ${esc(person(a)?.name || translate("ui.theFirstPerson"))}</p><h3>${esc(k.label)}</h3>${k.detail ? `<p>${esc(k.detail)}</p>` : ""}${k.ancestorId ? `<div class="pills"><span class="pill blue">${icon("user")}${translate("ui.commonAncestor")} ${esc(person(k.ancestorId)?.name)}</span></div>` : k.virtualAncestor ? `<p class="hint">${translate("ui.commonParentsAreNotRecordedTheCalculationUses")}</p>` : ""}${k.found ? `<div class="pills"><span class="pill ${k.verified ? "teal" : "amber"}">${icon(k.verified ? "fileCheck" : "fileMissing")}${k.verified ? translate("ui.allRelationshipsHaveOfficialSources") : translate("ui.someRelationshipsLackOfficialSources")}</span>${k.adopted ? `<span class="pill review">${translate("ui.pathIncludesAdoption")}</span>` : ""}${k.disputed ? `<span class="pill red">${translate("ui.pathIncludesDisputedRelationships")}</span>` : ""}</div><button type="button" class="btn primary" data-show-kin-path style="margin-top:17px">${icon("route")}${translate("ui.showPathOnMap")}</button>` : ""}</section>${
      k.pathVia
        ? `<div class="kin-paths single"><div><p class="field-caption">${translate("ui.pathThroughFamilyRelationships")}</p>${k.pathVia.people
            .map(
              (id, i) =>
                `<div class="kin-path-item">${avatar(person(id))}<span><b>${esc(person(id)?.name)}</b><small>${
                  i === 0
                    ? translate("ui.firstPerson")
                    : esc(
                        {
                          parent: translate("ui.parentOfThePreviousPerson"),
                          child: translate("ui.childOfThePreviousPerson"),
                          partner: translate("ui.partnerOfThePreviousPerson"),
                          sibling: translate("ui.siblingOfThePreviousPerson"),
                        }[k.pathVia.steps[i - 1]],
                      )
                }</small></span></div>`,
            )
            .join("")}</div></div>`
        : ""
    }${k.pathFrom && k.pathTo ? `<div class="kin-paths"><div><p class="field-caption">${esc(person(a)?.name)}</p>${kinPathMarkup(k.pathFrom)}</div><div><p class="field-caption">${esc(person(b)?.name)}</p>${kinPathMarkup(k.pathTo)}</div></div>` : ""}<p class="hint">${translate("ui.resultsUseRecordedRelationshipsNotSurnamesOrFamily")}${k.kind === "cousin" ? ` <a href="${source}" target="_blank" rel="noopener noreferrer">${translate("ui.howGenerationsAreCounted")}</a>` : ""}</p>`;
}
export function comparePeople(to = null) {
  if (appState.project.people.length < 2) {
    toast(translate("ui.addAtLeastTwoPeople"));
    return;
  }
  const first =
      appState.selected?.kind === "person"
        ? appState.selected.id
        : appState.project.claimantId || appState.project.people[0].id,
    second =
      to && to !== first
        ? to
        : appState.project.people.find((p) => p.id !== first).id;
  openDialog(
    translate("ui.howAreWeRelated"),
    `<div class="form-grid"><label class="field">${translate("ui.meFirstPerson")}<select id="kinFrom">${personOptions(first)}</select></label><label class="field">${translate("ui.howAreWeRelated")}<select id="kinTo">${personOptions(second)}</select></label></div><div id="kinResult"></div>`,
    {
      wide: true,
      footer: false,
    },
  );
  renderKinResult();
}
