import { normalizeModePurposes } from "../core/workspace-modes.js";
import { isMedia } from "../core/attachments.js";
import { $ } from "../core/dom.js";
import { sourceEvidence, sourceVerificationConfig } from "../core/sources.js";
import { state as appState } from "../core/state.js";
import { safeUrl, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { doc, relation } from "../model/lookup.js";
import { profileRecordTarget } from "../model/source-record-links.js";
import { profileRecordError } from "../model/profile-records.js";
import { commit } from "../services/history.js";
import { openDialog } from "../ui/dialog.js";
import { bindDocumentForm, renderDocumentForm } from "../ui/forms/document.js";
import { attachmentMime } from "../services/attachment-files.js";
import { bindSourceAttachments } from "./source-attachment-editor.js";

export async function editDocument(id = null, files = [], context = {}) {
  const old = id
    ? doc(id)
    : {
        title: context.title || files[0]?.name || "",
        attachments: [],
        type: context.type || "other",
        status:
          context.status ||
          (files.length || context.paste ? "needs_review" : "requested"),
        evidence: "unverified",
        people: context.personId ? [context.personId] : [],
        relations: context.relationId ? [context.relationId] : [],
        propertyIds: context.propertyId ? [context.propertyId] : [],
        purposes: [],
        subjectIds: context.personId ? [context.personId] : [],
        source: "",
        repository: "",
        reference: "",
        sourceUrl: "",
        accessedAt: "",
        language: "",
        transcription: "",
        date: context.date || "",
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
    !id && isMedia(attachmentMime(files[0] || { name: "", type: "" }))
      ? "recording"
      : attachmentMime(files[0] || { name: "", type: "" })?.startsWith(
            "image/",
          ) &&
          old.type === "other" &&
          !id
        ? "photo"
        : old.type;
  const chosenEvidence = sourceEvidence({ ...old, type: chosenType });
  let attachments;
  const f = await openDialog(
    id ? translate("ui.editSource") : translate("ui.addSource"),
    renderDocumentForm(old, chosenType, chosenEvidence),
    {
      wide: true,
      kind: "source-edit",
      onOpen: () => {
        bindDocumentForm();
        attachments = bindSourceAttachments($("#modalForm"), old, files);
        if (context.paste) attachments.paste();
      },
      validate: (f) =>
        attachments.error() ||
        (!f.get("title").trim()
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
              )),
    },
  );
  attachments.dispose();
  if (!f) return;
  const data = {
    title: f.get("title").trim(),
    attachments: attachments.entries,
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
    purposes: normalizeModePurposes(f.getAll("purposes")),
  };
  for (const k of [
    "date",
    "collectionTitle",
    "volume",
    "pages",
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
        x: 55 + (appState.project.documents.length % 3) * 265,
        y: 810 + Math.floor(appState.project.documents.length / 3) * 160,
      };
      appState.project.documents.push(d);
    }
    if (context.recordTarget) {
      const target = profileRecordTarget(
        appState.project,
        context.recordTarget,
      );
      if (target) target.record.sourceId = d.id;
    }
    for (const [assetId, blob] of attachments.blobs)
      appState.blobs.set(assetId, blob);
  });
}
