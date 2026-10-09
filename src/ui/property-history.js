import { personDisplayName } from "../model/person-display.js";
import { esc } from "../core/dom.js";
import { propertyRecordConfigs } from "../core/property-records.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { displayDate } from "../model/dates.js";
import { kinshipBetween } from "../model/kinship.js";
import { person } from "../model/lookup.js";
import {
  analyzeProperty,
  propertySnapshot,
  propertyTimeline,
} from "../model/property-history.js";
import { propertyPeople } from "../model/property-records.js";
import { sourceChips } from "./components.js";
import { icon } from "./icons.js";
import { fields, recordValues } from "./profile-fields.js";

function party(id, external) {
  return personDisplayName(person(id)) || external || t("ui.notSpecified");
}
function period(record) {
  return `${displayDate(record.from) || t("ui.dateUnknown")} — ${displayDate(record.to) || (record.status === "current" ? t("ui.propertyRightCurrent") : t("ui.dateUnknown"))}`;
}
export function propertyRecordTitle(
  kind,
  record,
  { includeUnknown = true } = {},
) {
  const cfg = propertyRecordConfigs()[kind],
    options = cfg.fields.find(([key]) => key === "kind")[3];
  const name = (id, external) =>
    personDisplayName(person(id)) ||
    external ||
    (includeUnknown ? t("ui.notSpecified") : "");
  const parties =
    kind === "transfers"
      ? [
          name(record.fromId, record.fromExternal),
          name(record.toId, record.toExternal),
        ]
          .filter(Boolean)
          .join(" → ")
      : name(record.personId, record.externalPerson);
  return [options[record.kind] || cfg.label, parties]
    .filter(Boolean)
    .join(" · ");
}
export function propertyRecordCard(
  asset,
  kind,
  record,
  editable = true,
  issues = [],
) {
  const cfg = propertyRecordConfigs()[kind];
  const status = !editable
    ? kind === "rights"
      ? [displayDate(record.from), displayDate(record.to)]
          .filter(Boolean)
          .join(" — ")
      : displayDate(record.date)
    : kind === "rights"
      ? period(record)
      : displayDate(record.date) || t("ui.dateUnknown");
  const relatedClaim =
    kind === "claims" && record.personId && record.throughPersonId
      ? [
          [
            t("ui.propertyClaimRelationship"),
            `${party(record.throughPersonId)}: ${kinshipBetween(record.throughPersonId, record.personId).label}`,
          ],
        ]
      : [];
  const findings = issues.filter(
    (issue) => issue.kind === kind && issue.id === record.id,
  );
  const verification = cfg.fields.find(([key]) => key === "verification")[3];
  const verificationLabel =
    record.verification && record.verification !== "unspecified"
      ? verification[record.verification]
      : "";
  const summary = [status, record.sharePercent ? `${record.sharePercent}%` : ""]
    .filter(Boolean)
    .join(" · ");
  return `<article class="property-history-record" data-estate-record="${record.id}"><div class="property-record-head"><div><h4>${esc(propertyRecordTitle(kind, record, { includeUnknown: editable }))}</h4>${summary ? `<p>${esc(summary)}</p>` : ""}</div>${editable ? `<button class="iconbtn ghost" data-edit-property-record="${record.id}" data-property-id="${asset.id}" data-property-record-kind="${kind}" aria-label="${esc(t("ui.edit") + " " + cfg.label)}">${icon("edit")}</button>` : ""}</div>${verificationLabel ? `<span class="pill ${record.verification === "corroborated" ? "" : "review"}">${esc(verificationLabel)}</span>` : ""}${
    kind === "claims" && editable
      ? fields([
          [
            t("ui.status"),
            cfg.fields.find(([key]) => key === "status")[3][record.status],
          ],
          [t("ui.propertyClaimGrounds"), record.grounds],
          [t("ui.propertyEvidenceNeeded"), record.evidenceNeeded],
          ...relatedClaim,
        ])
      : record.grounds
        ? `<p class="property-record-notes">${esc(record.grounds)}</p>`
        : ""
  }${findings.length ? `<ul class="property-record-findings">${findings.map((issue) => `<li>${esc(t("ui." + issue.code))}</li>`).join("")}</ul>` : ""}${editable ? `<details><summary>${t("ui.propertyRecordDetails")}</summary>${fields(recordValues(cfg, record))}</details>` : fields([...recordValues(cfg, record), ...relatedClaim])}${sourceChips(record.sourceId ? [record.sourceId] : [])}</article>`;
}
export function propertySnapshotMarkup(asset, date) {
  const snapshot = propertySnapshot(asset, date);
  const rows = (entries) =>
    entries
      .map(
        ({ record, period: certainty }) =>
          `<li><b>${esc(party(record.personId, record.externalPerson))}</b><span>${esc(propertyRecordConfigs().rights.fields.find(([key]) => key === "kind")[3][record.kind])}${record.sharePercent ? ` · ${esc(record.sharePercent)}%` : ""}</span><small>${esc(period(record))}</small>${certainty === "uncertain" ? `<span class="pill review">${t("ui.propertyPeriodUncertain")}</span>` : ""}${record.verification !== "corroborated" ? `<span class="pill review">${t("ui.pendingVerification")}</span>` : ""}</li>`,
      )
      .join("");
  return `<div class="property-snapshot"><section><h3>${t("ui.propertyRecordedOwners")}</h3><ul>${rows(snapshot.ownership)}</ul>${snapshot.ownership.length ? "" : `<p class="hint">${t("ui.propertyNoDatedOwner")}</p>`}</section><section><h3>${t("ui.propertyUsers")}</h3><ul>${rows(snapshot.use)}</ul>${snapshot.use.length ? "" : `<p class="hint">${t("ui.propertyNoUseRecords")}</p>`}</section></div>`;
}
export function propertyHistoryView(asset, date) {
  const { issues, snapshot } = analyzeProperty(asset, state.project, date);
  const issueCodes = [...new Set(issues.map((i) => i.code))];
  const participants = [...propertyPeople(asset)].map(person).filter(Boolean);
  return `<button type="button" class="btn small" data-property-back>${icon("chevronLeft")}${t("ui.propertyBack")}</button><div class="property-detail-title"><div><h2>${esc(asset.title)}</h2><p>${esc([asset.identifier, asset.country, asset.location].filter(Boolean).join(" · "))}</p></div><button class="btn" data-edit-property="${asset.id}">${icon("edit")}${t("ui.editProperty")}</button></div><details class="property-analysis-help"><summary>${t("ui.propertyAnalysisHelp")}</summary><p class="hint">${t("ui.propertyAnalysisHint")}</p></details>${propertySnapshotMarkup(asset, date)}<section class="property-review"><h3>${t("ui.propertyReview")} <span class="pill">${issueCodes.length}</span></h3>${issueCodes.length ? `<ul>${issueCodes.map((code) => `<li>${esc(t("ui." + code))}</li>`).join("")}</ul>` : `<p class="hint">${t("ui.propertyNoReviewFindings")}</p>`}</section><div class="property-entry-actions"><button class="btn" data-add-property-record="rights" data-property-id="${asset.id}">${icon("plus")}${t("ui.propertyAddRight")}</button><button class="btn primary" data-add-property-record="transfers" data-property-id="${asset.id}">${icon("plus")}${t("ui.propertyAddTransfer")}</button><button class="btn" data-add-property-record="claims" data-property-id="${asset.id}">${icon("plus")}${t("ui.propertyAddClaim")}</button></div><section class="property-ledger"><h3>${t("ui.propertyChronology")}</h3><p class="hint">${t("ui.propertyChronologyHint")}</p>${
    propertyTimeline(asset)
      .filter((r) => r.kind !== "claims")
      .map(({ kind, record }) =>
        propertyRecordCard(asset, kind, record, true, issues),
      )
      .join("") || `<p class="hint">${t("ui.propertyNoHistory")}</p>`
  }</section><section class="property-claims"><h3>${t("ui.propertyClaims")} <span class="pill">${snapshot.claims.length} ${t("ui.propertyOpen")}</span></h3>${(asset.claims || []).map((record) => propertyRecordCard(asset, "claims", record, true, issues)).join("") || `<p class="hint">${t("ui.propertyNoClaims")}</p>`}</section><details class="property-family"><summary>${t("ui.propertyFamilyConnections")}</summary><p class="hint">${t("ui.propertyFamilyHint")}</p>${participants.map((p) => `<div><button class="text-person" data-biography="${p.id}">${esc(personDisplayName(p))}</button>${asset.ownerId && asset.ownerId !== p.id ? `<span>${esc(party(asset.ownerId))}: ${esc(kinshipBetween(asset.ownerId, p.id).label)}</span>` : asset.ownerId === p.id ? `<span>${t("ui.propertyReferenceOwner")}</span>` : ""}</div>`).join("")}</details>`;
}

export function propertyHistoryReport(asset) {
  return propertyTimeline(asset)
    .map(({ kind, record }) => propertyRecordCard(asset, kind, record, false))
    .join("");
}
