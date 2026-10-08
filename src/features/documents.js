import { isMedia } from "../core/attachments.js";
import {
  sourceEvidence,
  sourceNeedsReview,
  sourceVerificationConfig,
} from "../core/sources.js";
import { profileRecordError } from "../model/profile-records.js";
import { recordValues } from "../ui/profile-fields.js";
import { renderDocumentForm, bindDocumentForm } from "../ui/forms/document.js";
import { defaultScopes, evidenceTypes, types } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { bytes, safeUrl, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import {
  documentSubjects,
  edgeState,
  gaps,
  hasFile,
  linkedDocs,
  requirements,
  route,
  sourceInScope,
} from "../model/evidence.js";
import { doc, person, relation } from "../model/project.js";
import { objectUrl } from "../services/files.js";
import { commit } from "../services/history.js";
import {
  avatar,
  documentIcon,
  requirementCard,
  sourceLink,
  statusBadge,
  typeOptions,
} from "../ui/components.js";
import { openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
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
        d.transcription,
        d.notes,
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
    `<div class="intro-line"><div><h2>${translate("ui.sourcesSupportingYourTree")}</h2><p>${translate("ui.aDocumentCanBeAvailableWithoutADigital")}</p></div></div><div class="drop-zone" id="dropZone" role="button" tabindex="0">${icon("upload")}<span>${translate("ui.addDocumentsOrPhotographs")}<small>${translate("ui.attachmentUploadHint")}</small></span><span class="btn small">${translate("ui.chooseFiles")}</span></div><div class="filterbar"><div class="search">${icon("search")}<input id="docSearch" value="${esc(appState.docFilter)}" placeholder="${translate("ui.nameArchiveRecordNumberOrText")}" aria-label="${translate("ui.searchSources")}"></div><select id="docTypeFilter" aria-label="${translate("ui.sourceType")}"><option value="">${translate("ui.allTypes")}</option>${typeOptions(types(), appState.docTypeFilter)}</select><select id="docFileFilter" aria-label="${translate("ui.fileAvailability")}"><option value="">${translate("ui.allRecords")}</option><option value="attached" ${appState.docFileFilter === "attached" ? "selected" : ""}>${translate("ui.fileAttached2")}</option><option value="missing" ${appState.docFileFilter === "missing" ? "selected" : ""}>${translate("ui.noDigitalCopy2")}</option></select><label class="source-all"><input type="checkbox" id="docShowAll" ${appState.docShowAll ? "checked" : ""}>${translate("ui.allTreeSources")}</label><div class="layout-switch"><button class="${appState.docLayout === "cards" ? "active" : ""}" data-doc-layout="cards" aria-label="${translate("ui.sourceCards")}">${icon("grid")}</button><button class="${appState.docLayout === "table" ? "active" : ""}" data-doc-layout="table" aria-label="${translate("ui.sourceTable")}">${icon("list")}</button></div></div><div class="source-tabs">${tabs.map(([f, l]) => `<button class="source-tab ${appState.docStatusFilter === f ? "active" : ""}" data-source-filter="${f}">${l}<span>${count(f)}</span></button>`).join("")}</div>${appState.docLayout === "table" ? `<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>${translate("ui.source")}</th><th>${translate("ui.availability")}</th><th>${translate("ui.evidenceType")}</th><th>${translate("ui.file")}</th><th></th></tr></thead><tbody>${docs.map((d) => `<tr><td><button data-document="${d.id}">${esc(d.title)}</button><small>${esc(d.repository || d.source || types()[d.type])}</small></td><td>${statusBadge(d)}</td><td><span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${esc(evidenceTypes()[d.evidence])}</span></td><td><span class="file-state ${hasFile(d) ? "attached" : ""}">${hasFile(d) ? bytes(d.size) : translate("ui.notAttached")}</span></td><td><button class="iconbtn small" data-edit-document="${d.id}" aria-label="${translate("ui.editSource")}">${icon("edit")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="doc-grid">${docs.map((d) => `<article class="doc-card"><button class="doc-preview ${d.type}" data-document="${d.id}" aria-label="${translate("ui.open")} ${esc(d.title)}">${d.mime?.startsWith("image/") && hasFile(d) ? `<img src="${objectUrl(d.assetId)}" alt="">` : icon(documentIcon(d))}<span class="preview-tag">${esc(types()[d.type])}</span></button><div class="doc-body">${statusBadge(d)}<h3>${esc(d.title)}</h3><span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${icon(d.evidence === "official" ? "badge" : "help")}${esc(evidenceTypes()[d.evidence])}</span><p class="source-origin">${icon("landmark")}${esc(d.repository || d.source || translate("ui.sourceNotSpecified"))}</p>${d.reference ? `<p>${esc(d.reference)}</p>` : ""}<p class="source-links">${d.people.length} ${translate("ui.people")} ${d.relations.length} ${translate("ui.relationships")}${d.date ? " · " + esc(d.date) : ""}</p></div><div class="doc-foot"><span class="file-state ${hasFile(d) ? "attached" : ""}">${icon("paperclip")}${hasFile(d) ? translate("ui.fileAttached2") : translate("ui.noCopy")}</span><button class="iconbtn small" data-attach-document="${d.id}" aria-label="${hasFile(d) ? translate("ui.replace") : translate("ui.add")} ${translate("ui.file2")}" title="${hasFile(d) ? translate("ui.replace") : translate("ui.add")} ${translate("ui.file2")}">${icon("upload")}</button><button class="iconbtn small" data-edit-document="${d.id}" aria-label="${translate("ui.editSource")}" title="${translate("ui.edit")}">${icon("edit")}</button><button class="iconbtn small" data-document="${d.id}" aria-label="${translate("ui.openSource")}" title="${translate("ui.open")}">${icon("eye")}</button></div></article>`).join("")}</div>`}${docs.length ? "" : `<div class="empty">${icon("book")}<h2>${appState.project.documents.length ? translate("ui.nothingMatchesTheseFilters") : translate("ui.startWithYourFirstSource")}</h2><p>${translate("ui.addAFileOrARecordOfA")}</p><button class="btn primary" data-action="reference">${icon("plus")}${translate("ui.addRecord")}</button></div>`}`;
}
export function renderGaps() {
  const gs = gaps(),
    path = route(),
    scope =
      appState.project.purpose === "inheritance" && path.found
        ? appState.project.people.filter((p) => path.people.includes(p.id))
        : appState.project.people;
  const available = scope.flatMap(requirements).filter((t) => t.done).length,
    review = scope
      .flatMap(requirements)
      .filter((t) => t.state === "review").length;
  $("#otherView").innerHTML =
    `<div class="intro-line"><div><h2>${translate("ui.whatYouHaveAndWhatIsStillMissing")}</h2><p>${appState.project.purpose === "inheritance" && path.found ? translate("ui.documentsForTheRouteFromOwnerToClaimant") : translate("ui.documentsForPeopleAndFamilyRelationshipsInThe")}</p></div></div><div class="banner">${icon("clipboard")}${translate("ui.editTheChecklistInThePersonProfileLabels")}</div><div class="gaps-summary"><div class="stat"><strong style="color:var(--teal)">${available}</strong><small>${translate("ui.requiredDocumentsAvailable")}</small></div><div class="stat"><strong style="color:var(--amber)">${gs.length}</strong><small>${translate("ui.evidenceGaps")}</small></div><div class="stat"><strong style="color:var(--violet)">${review}</strong><small>${translate("ui.needReview")}</small></div></div>${scope
      .map((p) => {
        const req = requirements(p);
        if (!req.length) return "";
        return `<section class="gap-group"><div class="gap-head"><button class="kin-person gap-person-title" data-person="${p.id}">${avatar(p)}<span><h3>${esc(p.name)}</h3><small>${esc(years(p))}</small></span></button><span class="pill ${req.every((t) => t.done) ? "teal" : "amber"}">${req.filter((t) => t.done).length} / ${req.length} ${translate("ui.available2")}</span></div>${req.map((t) => requirementCard(p, t)).join("")}</section>`;
      })
      .join(
        "",
      )}<div class="panel-title" style="margin-top:25px"><h3>${translate("ui.relationshipDocuments")}</h3></div>${
      gs
        .filter((g) => g.kind === "relation")
        .map((g) => {
          const r = relation(g.id),
            state = edgeState(r),
            ds = linkedDocs("relation", r.id);
          return `<section class="gap-group"><h3>${esc(g.name)}</h3><div class="requirement ${["review", "requested"].includes(state) ? state : "missing"}" style="margin-top:12px">${icon(state === "review" ? "search" : state === "requested" ? "fileClock" : "fileMissing")}<span><b>${esc(types()[g.type])}</b><small>${state === "review" ? translate("ui.sourceAddedReviewTheRelationship") : state === "requested" ? translate("ui.requestedAwaitingDocument") : state === "indirect" ? translate("ui.onlyIndirectEvidenceAvailable") : translate("ui.officialSourceMissing")}</small></span>${ds.length ? `<button data-document="${ds[0].id}">${translate("ui.open")}</button>` : `<button data-gap-kind="relation" data-gap-id="${r.id}" data-gap-type="${g.type}">${translate("ui.add")}</button>`}</div></section>`;
        })
        .join("") ||
      `<p class="hint">${translate("ui.noGapsInRelationshipDocuments")}</p>`
    }`;
}
export async function editDocument(id = null, file = null, context = {}) {
  const old = id
    ? doc(id)
    : {
        title: file?.name || "",
        type: context.type || "other",
        status: context.status || (file ? "needs_review" : "requested"),
        evidence: "unverified",
        people: context.personId ? [context.personId] : [],
        relations: context.relationId ? [context.relationId] : [],
        propertyIds: context.propertyId ? [context.propertyId] : [],
        purposes: Object.keys(defaultScopes),
        subjectIds: context.personId ? [context.personId] : [],
        source: "",
        repository: "",
        reference: "",
        sourceUrl: "",
        accessedAt: "",
        language: "",
        transcription: "",
        date: "",
        notes: "",
      };
  if (!old) return;
  if (context.relationId && !id) {
    const r = relation(context.relationId);
    old.people = [r.from, r.to];
    old.subjectIds = ["parent", "adopted"].includes(r.type)
      ? [r.to]
      : [r.from, r.to];
    old.type =
      context.type ||
      (r.type === "spouse"
        ? "marriage"
        : r.type === "parent"
          ? "birth"
          : "photo");
    if (["acquaintance", "unconfirmed"].includes(r.type))
      old.evidence = "indirect";
  }
  const chosenType =
    !id && isMedia(file?.mime)
      ? "recording"
      : file?.mime.startsWith("image/") && old.type === "other" && !id
        ? "photo"
        : old.type;
  const chosenEvidence = sourceEvidence({ ...old, type: chosenType });
  const f = await openDialog(
    id ? translate("ui.editSource") : translate("ui.addSource"),
    renderDocumentForm(file, old, chosenType, id, chosenEvidence),
    {
      wide: true,
      onOpen: bindDocumentForm,
      validate: (f) =>
        !f.get("title").trim()
          ? translate("ui.enterASourceTitle")
          : f.get("sourceUrl") && !safeUrl(f.get("sourceUrl"))
            ? translate("ui.theLinkMustStartWithHttpsOrHttp")
            : profileRecordError(
                sourceVerificationConfig(),
                Object.fromEntries(
                  sourceVerificationConfig().fields.map(([key]) => [
                    key,
                    f.get("source-" + key) || "",
                  ]),
                ),
              ),
    },
  );
  if (!f) return;
  const data = {
    title: f.get("title").trim(),
    type: f.get("type"),
    status: f.get("status"),
    evidence: f.get("evidence"),
    ...Object.fromEntries(
      sourceVerificationConfig().fields.map(([key]) => [
        key,
        f.get("source-" + key) || "",
      ]),
    ),
    people: [...new Set([...f.getAll("people"), ...f.getAll("subjectIds")])],
    subjectIds: f.getAll("subjectIds"),
    relations: f.getAll("relations"),
    propertyIds: f.getAll("propertyIds"),
    purposes: f.getAll("purposes").length
      ? f.getAll("purposes")
      : Object.keys(defaultScopes),
  };
  for (const k of [
    "date",
    "source",
    "repository",
    "reference",
    "sourceUrl",
    "accessedAt",
    "language",
    "transcription",
    "notes",
  ])
    data[k] = String(f.get(k) || "");
  data.evidence = sourceEvidence(data);
  commit(() => {
    let d = old;
    if (id) Object.assign(d, data);
    else {
      d = {
        ...data,
        id: uid(),
        assetId: "",
        filename: "",
        mime: "",
        size: 0,
        x: 55 + (appState.project.documents.length % 3) * 265,
        y: 810 + Math.floor(appState.project.documents.length / 3) * 160,
      };
      appState.project.documents.push(d);
    }
    if (file) {
      d.assetId = uid();
      appState.blobs.set(d.assetId, file.blob);
      d.filename = file.name;
      d.mime = file.mime;
      d.size = file.blob.size;
    }
  });
}
export async function viewDocument(id) {
  const d = doc(id);
  if (!d) return;
  const url = objectUrl(d.assetId),
    external = sourceLink(d);
  const preview =
    d.mime?.startsWith("image/") && url
      ? `<img class="file-view" src="${url}" alt="${esc(d.title)}">`
      : d.mime === "application/pdf" && url
        ? `<iframe class="pdf-view" src="${url}" title="${esc(d.title)}"></iframe>`
        : isMedia(d.mime) && url
          ? `<${d.mime.startsWith("audio/") ? "audio" : "video"} class="media-view" controls preload="metadata" src="${url}" aria-label="${esc(d.title)}"></${d.mime.startsWith("audio/") ? "audio" : "video"}>`
          : `<div class="file-placeholder">${icon(documentIcon(d))}<p>${url ? translate("ui.fileAvailableToDownload") : d.status === "available" ? `${translate("ui.documentMarkedAsAvailable")}<br>${translate("ui.noDigitalCopyAttachedYet")}` : d.status === "requested" ? `${translate("ui.documentRequested2")}<br>${translate("ui.attachTheFileWhenReceived")}` : d.status === "not_found" ? `${translate("ui.documentNotFound")}<br>${translate("ui.recordDetailsOfYourSearch")}` : `${translate("ui.sourceDetailsSaved")}<br>${translate("ui.addAFileOrAnExternalLink")}`}</p><button type="button" class="btn" data-attach-document="${id}">${icon("upload")}${url ? translate("ui.replaceFile") : translate("ui.addFile")}</button></div>`;
  const details = [
    [translate("ui.documentType"), types()[d.type]],
    [translate("ui.receivedFromSource"), d.source],
    [translate("ui.archiveOrCollection"), d.repository],
    [translate("ui.recordReference"), d.reference],
    [translate("ui.documentDate"), d.date],
    [translate("ui.accessedRequested"), d.accessedAt],
    [translate("ui.language"), d.language],
    ...recordValues(sourceVerificationConfig(), d),
  ];
  await openDialog(
    d.title,
    `<div class="source-view"><div class="source-preview">${preview}</div><div class="source-detail"><div class="pills">${statusBadge(d)}<span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${icon(d.evidence === "official" ? "badge" : "help")}${esc(evidenceTypes()[d.evidence])}</span><span class="pill">${icon("paperclip")}${hasFile(d) ? bytes(d.size) + ` ${translate("ui.fileAttached3")}` : translate("ui.noDigitalCopy2")}</span></div><h3>${icon("landmark")}${translate("ui.sourceProvenance")}</h3><dl>${details
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
      .join(
        "",
      )}</dl><div class="source-actions">${external ? `<a class="btn small" href="${esc(external)}" target="_blank" rel="noopener noreferrer">${icon("external")}${translate("ui.openSource")}</a>` : ""}<button type="button" class="btn small" data-copy-citation="${id}">${icon("copy")}${translate("ui.copyCitation")}</button></div><h3>${icon("user")}${translate("ui.documentAbout")}</h3><div class="source-binds">${
      documentSubjects(d)
        .map(person)
        .filter(Boolean)
        .map(
          (p) =>
            `<button type="button" data-source-person="${p.id}">${esc(p.name)}</button>`,
        )
        .join("") ||
      `<span class="hint">${translate("ui.theDocumentSubjectHasNotBeenSpecified")}</span>`
    }</div><h3>${icon("users")}${translate("ui.allRelatedPeople")}</h3><div class="source-binds">${
      d.people
        .map((pid) => person(pid))
        .filter(Boolean)
        .map(
          (p) =>
            `<button type="button" data-source-person="${p.id}">${esc(p.name)}</button>`,
        )
        .join("") ||
      `<span class="hint">${translate("ui.noPeopleSelected")}</span>`
    }</div>${
      d.relations.length
        ? `<h3>${icon("link")}${translate("ui.supportsRelationships")}</h3><div class="source-binds">${d.relations
            .map((rid) => relation(rid))
            .filter(Boolean)
            .map(
              (r) =>
                `<button type="button" data-source-relation="${r.id}">${esc(person(r.from)?.name)} · ${esc(person(r.to)?.name)}</button>`,
            )
            .join("")}</div>`
        : ""
    }</div></div>${d.transcription ? `<p class="field-caption">${icon("scan")}${translate("ui.documentText")}</p><div class="transcription">${esc(d.transcription)}</div>` : ""}${d.notes ? `<p class="field-caption">${icon("notebook")}${translate("ui.notes")}</p><div class="note-box">${esc(d.notes)}</div>` : ""}<div class="source-footer">${url ? `<button type="button" class="btn" data-download-doc="${id}">${icon("download")}${translate("ui.downloadFile")}</button><button type="button" class="btn" data-attach-document="${id}">${icon("upload")}${translate("ui.replaceFile")}</button>` : ""}<button type="button" class="btn primary" data-edit-document="${id}">${icon("edit")}${translate("ui.edit")}</button>${url && d.mime.startsWith("image/") ? `<button type="button" class="btn" data-recrop="${id}">${icon("photo")}${translate("ui.crop")}</button>` : ""}<button type="button" class="btn danger" data-delete-document="${id}">${icon("trash")}</button></div>`,
    {
      wide: true,
      footer: false,
    },
  );
}
