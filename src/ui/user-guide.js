import { esc } from "../core/dom.js";
import { guideLessons } from "../core/user-guide.js";
import {
  guideGroups,
  guideMarriages,
  guideParents,
  guidePeople,
  guidePersonName,
} from "../data/guide-example.js";
import { translate as t } from "../i18n/index.js";
import { icon } from "./icons.js";

function labels() {
  return {
    create: t("ui.createMap"),
    new: t("ui.newTree"),
    family: t("ui.modeFamily"),
    mode: t("ui.workspaceMode"),
    addPerson: t("ui.addPerson"),
    profiles: t("ui.personProfiles"),
    editProfile: t("ui.editProfile"),
    names: t("ui.nameHistory"),
    addRelationship: t("ui.addRelationship"),
    first: t("ui.firstPerson"),
    second: t("ui.secondPerson"),
    parenthood: t("ui.biologicalParenthood"),
    marriage: t("ui.registeredMarriage"),
    partnership: t("ui.personalPartnership"),
    adoption: t("ui.adoption"),
    stepParent: t("ui.stepParenthood"),
    groups: t("ui.familyGroups"),
    entireFamily: t("ui.wholeFamily"),
    sources: t("ui.documents"),
    noFile: t("ui.recordWithoutAFile"),
    interests: t("ui.activitiesAndSkills"),
    habits: t("ui.personalPortrait"),
    health: t("ui.medicalHistory"),
    scope: t("ui.chooseVisibleData"),
    layout: t("ui.layout"),
    savedViews: t("ui.savedMapViews"),
    saveView: t("ui.saveCurrentMapView"),
    generations: t("ui.generations3"),
    fit: t("ui.showEntireTree"),
    display: t("ui.display"),
    search: t("ui.connectionSearch"),
    kinship: t("ui.howAreWeRelated"),
    mapOptions: t("ui.mapOptions"),
    move: t("ui.moveCards"),
    export: t("ui.exportTree"),
    zip: t("ui.fullZipArchiveForEditing"),
    import: t("ui.import2"),
    biography: t("ui.autobiography"),
    print: t("ui.printBiography"),
    possible: t("ui.possibleKinship"),
  };
}
function examplePeople() {
  return `<h4>${t("ui.guideExamplePeople")}</h4><p>${t("ui.guideExamplePeopleHint")}</p><div class="guide-person-list">${guidePeople.map((person) => `<div><b>${esc(person.name)}</b><small>${esc(t(person.gender === "m" ? "ui.male" : "ui.female"))} · ${person.birth}${person.maiden ? ` · ${t("ui.maidenName")}: ${esc(person.maiden)}` : ""}</small></div>`).join("")}</div>`;
}
function exampleRelationships() {
  const pair = (from, to) =>
    `<span>${esc(guidePersonName(from))}</span>${icon("heart")}<span>${esc(guidePersonName(to))}</span>`;
  const rows = (pairs) =>
    pairs
      .map(
        ([from, to]) =>
          `<li><span>${esc(guidePersonName(from))}</span>${icon("arrowRight")}<span>${esc(guidePersonName(to))}</span></li>`,
      )
      .join("");
  return `<figure class="guide-family-example"><figcaption>${t("ui.guideExampleDiagram")}</figcaption><div class="guide-founder-pair">${pair(...guideMarriages[0])}</div><div class="guide-branches">${guideMarriages
    .slice(1)
    .map(
      ([from, to], i) =>
        `<div class="guide-branch"><div class="guide-couple">${pair(from, to)}</div><p>${icon("arrowRight")}${esc(guidePersonName(i === 0 ? "guide-robin" : "guide-avery"))}</p></div>`,
    )
    .join(
      "",
    )}</div><p>${t("ui.guideExampleResult")}</p></figure><h4>${t("ui.guideExampleMarriages")}</h4><p>${t("ui.guideExampleMarriagesHint", labels())}</p><ul class="guide-connection-list" data-guide-marriages>${rows(guideMarriages)}</ul><h4>${t("ui.guideExampleParenthood")}</h4><p>${t("ui.guideExampleParenthoodHint", labels())}</p><ul class="guide-connection-list" data-guide-parents>${rows(guideParents)}</ul><details class="guide-extra"><summary>${t("ui.guideOtherRelationships")}${icon("chevron")}</summary><p>${t("ui.guideOtherRelationshipsText", labels())}</p></details>`;
}
function exampleGroups() {
  return `<h4>${t("ui.guideExampleGroups")}</h4><dl class="guide-group-example">${guideGroups.map((group) => `<div><dt>${esc(group.name)}</dt><dd>${esc(group.members.map(guidePersonName).join(", "))}</dd></div>`).join("")}</dl>`;
}
export function renderUserGuide() {
  const textLabels = labels();
  const extras = {
    people: examplePeople,
    relationships: exampleRelationships,
    groups: exampleGroups,
  };
  return `<div class="user-guide" data-user-guide><aside class="guide-navigation"><p>${t("ui.guideContents")}</p><label class="guide-picker">${t("ui.guideChooseStep")}<select data-guide-picker>${guideLessons.map((lesson, i) => `<option value="${lesson.key}">${i + 1}. ${esc(t(lesson.title))}</option>`).join("")}</select></label><nav aria-label="${t("ui.guideContents")}">${guideLessons.map((lesson, i) => `<button type="button" data-guide-target="${lesson.key}" aria-controls="guide-${lesson.key}" aria-current="${i === 0 ? "step" : "false"}"><span>${i + 1}</span>${esc(t(lesson.title))}</button>`).join("")}</nav></aside><div class="guide-content"><p class="guide-intro">${t("ui.guideIntro")}</p><div class="guide-example-download"><div><b>${t("ui.guidePracticeTitle")}</b><p>${t("ui.guidePracticeHint", textLabels)}</p></div><button type="button" class="btn small" data-action="download-guide-example">${icon("download")}${t("ui.guideDownloadExample")}</button></div>${guideLessons.map((lesson, i) => `<details class="guide-lesson" data-guide-lesson="${lesson.key}" id="guide-${lesson.key}" ${i === 0 ? "open" : ""}><summary><span class="guide-step-number">${i + 1}</span>${icon(lesson.icon)}<h3>${esc(t(lesson.title))}</h3>${icon("chevron")}</summary><div><ol>${lesson.steps.map((key) => `<li>${esc(t(key, textLabels))}</li>`).join("")}</ol><p class="guide-note">${icon("info")}<span>${esc(t(lesson.note, textLabels))}</span></p>${extras[lesson.key]?.() || ""}</div></details>`).join("")}</div></div>`;
}

/** Guide navigation changes only the open lesson; it never edits the project. */
export function bindUserGuide(root) {
  const picker = root.querySelector("[data-guide-picker]");
  const jump = (key) => {
    const lesson = root.querySelector(`[data-guide-lesson="${key}"]`);
    if (!lesson) return;
    lesson.open = true;
    picker.value = key;
    for (const button of root.querySelectorAll("[data-guide-target]"))
      button.setAttribute(
        "aria-current",
        button.dataset.guideTarget === key ? "step" : "false",
      );
    lesson.scrollIntoView({ block: "start", behavior: "instant" });
    lesson.querySelector("summary").focus({ preventScroll: true });
  };
  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-guide-target]");
    if (target) jump(target.dataset.guideTarget);
  });
  picker.addEventListener("change", () => jump(picker.value));
}
