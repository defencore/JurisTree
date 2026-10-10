import { normalizeSourceAttachments } from "../source-attachments.js";
import { normalizeModePurposes } from "../../core/workspace-modes.js";
import { evidenceTypes, statusTypes, types } from "../../core/config.js";
import {
  sourceEvidence,
  sourceVerificationConfig,
} from "../../core/sources.js";
import { safeUrl } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { profileRecordError } from "../profile-records.js";
import { str, arr, pos } from "./schema.js";

export function normalizeImportedDocument(
  d,
  { peopleIds, relIds, assetIds, legacyDefault },
) {
  if (
    !Object.hasOwn(types(), d.type) ||
    !Object.hasOwn(statusTypes(), d.status) ||
    !Object.hasOwn(evidenceTypes(), d.evidence)
  )
    throw Error(translate("ui.invalidDocumentType"));
  const x = {
    id: d.id,
    type: d.type,
    status: d.status,
    evidence: sourceEvidence(d),
    purposes: normalizeModePurposes(d.purposes, {
      legacyDefault: legacyDefault,
    }),
    people: [...new Set([...arr(d.people), ...arr(d.subjectIds)])].filter(
      (id) => peopleIds.has(id),
    ),
    subjectIds: Array.isArray(d.subjectIds)
      ? arr(d.subjectIds).filter((id) => peopleIds.has(id))
      : null,
    relations: arr(d.relations).filter((id) => relIds.has(id)),
    propertyIds: arr(d.propertyIds).filter((id) => assetIds.has(id)),
    x: pos(d.x),
    y: pos(d.y),
    attachments: normalizeSourceAttachments(d),
  };
  for (const k of [
    "title",
    "source",
    "repository",
    "collectionTitle",
    "volume",
    "pages",
    "reference",
    "sourceUrl",
    "accessedAt",
    "language",
    "date",
    "notes",
    "transcription",
  ])
    x[k] = str(d[k], k === "transcription" ? 30000 : 16000);
  for (const [key, , type, options] of sourceVerificationConfig().fields) {
    let value = str(d[key], type === "textarea" ? 5000 : 1500);
    if (type === "select" && !Object.hasOwn(options, value))
      value = Object.keys(options)[0];
    x[key] = value;
  }
  const sourceError = profileRecordError(sourceVerificationConfig(), x);
  if (sourceError) throw Error(sourceError);
  if (x.sourceUrl && !safeUrl(x.sourceUrl))
    throw Error(translate("ui.unsupportedSourceLink"));
  return x;
}
