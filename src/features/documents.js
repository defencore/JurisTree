import { isMedia } from "../core/attachments.js";
import { defaultScopes, evidenceTypes, types } from "../core/config.js";
import { esc } from "../core/dom.js";
import { sourceEvidence, sourceVerificationConfig } from "../core/sources.js";
import { state as appState } from "../core/state.js";
import { bytes, safeUrl, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { documentSubjects, hasFile } from "../model/evidence.js";
import { doc, person, relation } from "../model/lookup.js";
import { profileRecordError } from "../model/profile-records.js";
import { objectUrl } from "../services/blobs.js";
import { commit } from "../services/history.js";
import { documentIcon, sourceLink, statusBadge } from "../ui/components.js";
import { openDialog } from "../ui/dialog.js";
import { bindDocumentForm, renderDocumentForm } from "../ui/forms/document.js";
import { icon } from "../ui/icons.js";
import { recordValues } from "../ui/profile-fields.js";

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
