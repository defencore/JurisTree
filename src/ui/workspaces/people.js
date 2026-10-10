import { $, esc } from "../../core/dom.js";
import { profileSectionCount } from "../../core/profile-catalog.js";
import { orderedProfileSections } from "../../core/profile-groups.js";
import { state } from "../../core/state.js";
import { getLocale, translate as t } from "../../i18n/index.js";
import { orderedPeople } from "../../model/person-selection.js";
import { personBiography } from "../../model/biography.js";
import { withProjectIndex } from "../../model/project.js";
import { displayDate } from "../../model/dates.js";
import {
  personDisplayName,
  personLifeDates,
} from "../../model/person-display.js";
import { person } from "../../model/lookup.js";
import { personPassesFilter } from "../../model/person-filter-state.js";
import { avatar, biographyButton, miniDoc } from "../components.js";
import { favoriteButton } from "../favorites.js";
import { kinGroups } from "../groups.js";
import { icon, icons } from "../icons.js";
import { personStatusMarkup } from "../person-status.js";
import { renderPersonDetails } from "../profile-details.js";
import { fields } from "../profile-fields.js";
import {
  bindProfileNavigation,
  profileNavigation,
} from "../profile-navigation.js";

export function renderProfiles() {
  return withProjectIndex(renderProfileWorkspace);
}

function renderProfileWorkspace() {
  const current = person(state.profileFocus);
  $("#otherView").classList.toggle("profiles-view", true);
  $("#otherView").innerHTML = current ? fullProfile(current) : directory();
  bindProfileNavigation($("[data-profile-browser]"));
  icons();
}

function directory() {
  const q = state.profileSearch.toLocaleLowerCase(getLocale()).trim();
  const people = orderedPeople(state.project.people).filter(
    (p) =>
      personPassesFilter(p.id) &&
      (!state.groupFilter || (p.groupIds || []).includes(state.groupFilter)) &&
      [
        p.name,
        p.aliases,
        p.place,
        ...(p.nameHistory || []).flatMap((r) => [r.fullName, r.surname]),
      ]
        .join(" ")
        .toLocaleLowerCase(getLocale())
        .includes(q),
  );
  return `<section class="profile-directory"><div class="profile-directory-toolbar"><label class="search">${icon("search")}<input id="profileSearch" type="search" value="${esc(state.profileSearch)}" placeholder="${t("ui.findAPerson")}" aria-label="${t("ui.searchPeople")}"></label><span class="hint">${people.length} / ${state.project.people.length} ${t("ui.people")}</span></div><p class="hint">${t("ui.profileDirectoryHint")}</p><div class="profile-directory-grid">${
    people
      .map((p) => {
        const biography = personBiography(state.project, p.id);
        const sections = orderedProfileSections().filter((key) =>
          profileSectionCount(p, key),
        ).length;
        return `<article class="profile-directory-card"><button type="button" class="profile-directory-open" data-full-profile="${p.id}">${avatar(p)}<span><b>${esc(personDisplayName(p))}</b><small>${esc(personLifeDates(p))}</small>${personStatusMarkup(p)}</span>${icon("arrowRight")}</button><div class="profile-directory-meta"><span>${icon("link")}${biography.relations.length} ${t("ui.relationships2")}</span><span>${icon("file")}${biography.documents.length} ${t("ui.sources")}</span><span>${icon("clipboard")}${sections} ${t("ui.profileSectionsCount")}</span></div><div class="profile-directory-actions">${favoriteButton(p, true)}<button type="button" class="btn small ghost" data-edit-person="${p.id}">${icon("edit")}${t("ui.edit")}</button></div></article>`;
      })
      .join("") ||
    `<div class="empty"><h2>${t(state.project.people.length ? "ui.noPeopleMatchThisSearch" : "ui.noPeopleYetAddTheFirstPerson")}</h2><button class="btn primary" data-action="add-person">${icon("addPerson")}${t("ui.addPerson")}</button></div>`
  }</div></section>`;
}

function fullProfile(p) {
  const biography = personBiography(state.project, p.id);
  const extra = [
    { key: "overview", label: t("ui.basicInformation"), icon: "user" },
    {
      key: "relationships",
      label: t("ui.recordedRelationships"),
      icon: "link",
    },
    { key: "documents", label: t("ui.documentsAndSources"), icon: "files" },
    { key: "property", label: t("ui.propertyAndShares"), icon: "home" },
  ];
  return `<div class="full-profile" data-profile-browser>${profileNavigation(p, extra)}<div class="full-profile-content"><p class="empty-search" data-profile-no-results hidden>${t("ui.noProfileSections")}</p><section class="full-profile-overview" data-profile-panel="overview"><button type="button" class="btn small ghost" data-profile-back>${icon("chevronLeft")}${t("ui.allProfiles")}</button><header>${avatar(p)}<div><h2>${esc(personDisplayName(p))}</h2><p>${esc(personLifeDates(p))}${p.place ? ` · ${esc(p.place)}` : ""}</p>${personStatusMarkup(p)}${p.aliases ? `<p class="hint">${t("ui.otherNames")}: ${esc(p.aliases)}</p>` : ""}</div>${favoriteButton(p, true)}</header><div class="full-profile-actions"><button class="btn primary" data-edit-person="${p.id}">${icon("edit")}${t("ui.editProfile")}</button><button class="btn" data-portrait="${p.id}">${icon("photo")}${t("ui.photo")}</button><button class="btn" data-profile-map="${p.id}">${icon("tree")}${t("ui.showOnMap")}</button>${biographyButton(p)}<button class="btn" data-print-biography="${p.id}" aria-label="${t("ui.printBiography")}" title="${t("ui.printBiography")}">${icon("printer")}PDF</button></div>${fields(
    [
      [
        t("ui.gender"),
        {
          m: t("ui.male"),
          f: t("ui.female"),
          x: t("ui.nonbinaryOther"),
          u: t("ui.notSpecified"),
        }[p.gender || "u"],
      ],
      [t("ui.birth"), displayDate(p.birth)],
      [t("ui.deathIfKnown"), displayDate(p.death)],
    ],
  )}${p.notes ? `<div class="note-box"><b>${t("ui.treeResearchNotes")}</b><p>${esc(p.notes)}</p></div>` : ""}</section><section class="full-profile-related" data-profile-panel="relationships"><div class="profile-panel-heading"><h3>${icon("link")}${t("ui.recordedRelationships")}</h3><button class="btn small" data-profile-relation="${p.id}">${icon("plus")}${t("ui.addRelationship")}</button></div>${kinGroups(p, { profiles: true })}</section><section class="full-profile-related" data-profile-panel="documents"><div class="profile-panel-heading"><h3>${icon("files")}${t("ui.documentsAndSources")}</h3><button class="btn small" data-add-for="${p.id}">${icon("plus")}${t("ui.addFile")}</button></div>${biography.documents.map(miniDoc).join("") || `<p class="hint">${t("ui.noCertificatesPhotosOrArchiveRecordsAddedYet")}</p>`}<button class="btn small ghost" data-profile-reference="${p.id}">${icon("reference")}${t("ui.recordWithoutAFile")}</button><button class="btn small ghost" data-open-profile-section="requirements" data-profile-person="${p.id}">${icon("clipboard")}${t("ui.requiredDocuments")}</button></section><section class="full-profile-related" data-profile-panel="property"><div class="profile-panel-heading"><h3>${icon("home")}${t("ui.propertyAndShares")}</h3><button class="btn small" data-profile-property="${p.id}">${icon("plus")}${t("ui.addProperty")}</button></div>${biography.property.map((asset) => `<button class="profile-property-link" data-property-history="${asset.id}"><span><b>${esc(asset.title)}</b><small>${esc([asset.identifier, asset.country, asset.location].filter(Boolean).join(" · "))}</small></span>${icon("arrowRight")}</button>`).join("") || `<p class="hint">${t("ui.noInformationYet")}</p>`}</section>${renderPersonDetails(p, { complete: true })}</div></div>`;
}
