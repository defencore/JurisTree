import { displayDate } from "../../model/dates.js";
import { evidenceTypes, types } from "../../core/config.js";
import { $, esc } from "../../core/dom.js";
import { sourceNeedsReview } from "../../core/sources.js";
import { state as appState } from "../../core/state.js";
import { bytes } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { hasFile, sourceInScope } from "../../model/evidence.js";
import {
  primaryAttachment,
  attachmentSize,
} from "../../model/source-attachments.js";
import { person } from "../../model/lookup.js";
import { objectUrl } from "../../services/blobs.js";
import { documentIcon, statusBadge, typeOptions } from "../components.js";
import { icon } from "../icons.js";

export function renderDocuments() {
  const matched = appState.project.documents.filter(
    (d) =>
      (appState.docShowAll || sourceInScope(d)) &&
      (!appState.docTypeFilter || d.type === appState.docTypeFilter) &&
      (!appState.docFileFilter ||
        hasFile(d) === (appState.docFileFilter === "attached")) &&
      [
        d.title,
        d.source,
        d.repository,
        d.reference,
        d.collectionTitle,
        d.volume,
        d.pages,
        d.transcription,
        d.notes,
        ...d.attachments.flatMap((file) => [file.filename, file.caption]),
        ...d.people.map((id) => person(id)?.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(appState.docFilter.toLowerCase()),
  );
  const docs = matched.filter((d) =>
    !appState.docStatusFilter || appState.docStatusFilter === "review"
      ? appState.docStatusFilter !== "review" || sourceNeedsReview(d)
      : d.status === appState.docStatusFilter,
  );
  const tabs = [
    ["", translate("ui.all")],
    ["available", translate("ui.documentsAvailable2")],
    ["requested", translate("ui.requested")],
    ["review", translate("ui.review2")],
    ["not_found", translate("ui.notFound")],
  ];
  const count = (f) =>
    matched.filter((d) =>
      !f || f === "review"
        ? f !== "review" || sourceNeedsReview(d)
        : d.status === f,
    ).length;
  $("#otherView").innerHTML =
    `<div class="intro-line"><div><h2>${translate("ui.sourcesSupportingYourTree")}</h2><p>${translate("ui.aDocumentCanBeAvailableWithoutADigital")}</p></div></div><div class="source-upload-bar"><button type="button" class="btn" data-paste-source>${icon("copy")}${translate("ui.pastePhotos")}</button></div><div class="drop-zone" id="dropZone" role="button" tabindex="0">${icon("upload")}<span>${translate("ui.addDocumentsOrPhotographs")}<small>${translate("ui.attachmentUploadHint")}</small></span><span class="btn small">${translate("ui.chooseFiles")}</span></div><div class="filterbar"><div class="search">${icon("search")}<input id="docSearch" value="${esc(appState.docFilter)}" placeholder="${translate("ui.nameArchiveRecordNumberOrText")}" aria-label="${translate("ui.searchSources")}"></div><select id="docTypeFilter" aria-label="${translate("ui.sourceType")}"><option value="">${translate("ui.allTypes")}</option>${typeOptions(types(), appState.docTypeFilter)}</select><select id="docFileFilter" aria-label="${translate("ui.fileAvailability")}"><option value="">${translate("ui.allRecords")}</option><option value="attached" ${appState.docFileFilter === "attached" ? "selected" : ""}>${translate("ui.fileAttached2")}</option><option value="missing" ${appState.docFileFilter === "missing" ? "selected" : ""}>${translate("ui.noDigitalCopy2")}</option></select><label class="source-all"><input type="checkbox" id="docShowAll" ${appState.docShowAll ? "checked" : ""}>${translate("ui.allTreeSources")}</label><div class="layout-switch"><button class="${appState.docLayout === "cards" ? "active" : ""}" data-doc-layout="cards" aria-label="${translate("ui.sourceCards")}">${icon("grid")}</button><button class="${appState.docLayout === "table" ? "active" : ""}" data-doc-layout="table" aria-label="${translate("ui.sourceTable")}">${icon("list")}</button></div></div><div class="source-tabs">${tabs.map(([f, l]) => `<button class="source-tab ${appState.docStatusFilter === f ? "active" : ""}" data-source-filter="${f}">${l}<span>${count(f)}</span></button>`).join("")}</div>${appState.docLayout === "table" ? `<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>${translate("ui.source")}</th><th>${translate("ui.availability")}</th><th>${translate("ui.evidenceType")}</th><th>${translate("ui.file")}</th><th></th></tr></thead><tbody>${docs.map((d) => `<tr><td><button data-document="${d.id}">${esc(d.title)}</button><small>${esc(d.repository || d.source || types()[d.type])}</small></td><td>${statusBadge(d)}</td><td><span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${esc(evidenceTypes()[d.evidence])}</span></td><td><span class="file-state ${hasFile(d) ? "attached" : ""}">${hasFile(d) ? translate("ui.attachedFilesCount", { count: d.attachments.length }) + " · " + bytes(attachmentSize(d)) : translate("ui.notAttached")}</span></td><td><button class="iconbtn small" data-edit-document="${d.id}" aria-label="${translate("ui.editSource")}">${icon("edit")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="doc-grid">${docs.map((d) => `<article class="doc-card"><button class="doc-preview ${d.type}" data-document="${d.id}" aria-label="${translate("ui.open")} ${esc(d.title)}">${primaryAttachment(d)?.mime.startsWith("image/") && hasFile(d) ? `<img src="${objectUrl(primaryAttachment(d).assetId)}" alt="" loading="lazy" decoding="async">` : icon(documentIcon(d))}<span class="preview-tag">${esc(types()[d.type])}</span></button><div class="doc-body">${statusBadge(d)}<h3>${esc(d.title)}</h3><span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${icon(d.evidence === "official" ? "badge" : "help")}${esc(evidenceTypes()[d.evidence])}</span><p class="source-origin">${icon("landmark")}${esc(d.repository || d.source || translate("ui.sourceNotSpecified"))}</p>${d.reference ? `<p>${esc(d.reference)}</p>` : ""}<p class="source-links">${d.people.length} ${translate("ui.people")} ${d.relations.length} ${translate("ui.relationships")}${d.date ? " · " + esc(displayDate(d.date)) : ""}</p></div><div class="doc-foot"><span class="file-state ${hasFile(d) ? "attached" : ""}">${icon("paperclip")}${hasFile(d) ? translate("ui.attachedFilesCount", { count: d.attachments.length }) : translate("ui.noCopy")}</span><button class="iconbtn small" data-attach-document="${d.id}" aria-label="${translate("ui.add")} ${translate("ui.file2")}" title="${translate("ui.add")} ${translate("ui.file2")}">${icon("upload")}</button><button class="iconbtn small" data-edit-document="${d.id}" aria-label="${translate("ui.editSource")}" title="${translate("ui.edit")}">${icon("edit")}</button><button class="iconbtn small" data-document="${d.id}" aria-label="${translate("ui.openSource")}" title="${translate("ui.open")}">${icon("eye")}</button></div></article>`).join("")}</div>`}${docs.length ? "" : `<div class="empty">${icon("book")}<h2>${appState.project.documents.length ? translate("ui.nothingMatchesTheseFilters") : translate("ui.startWithYourFirstSource")}</h2><p>${translate("ui.addAFileOrARecordOfA")}</p><button class="btn primary" data-action="reference">${icon("plus")}${translate("ui.addRecord")}</button></div>`}`;
}
