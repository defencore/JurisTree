import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { getLocale, translate as t } from "../i18n/index.js";
import {
  propertyInventorySummary,
  cashFlowAnalysis,
} from "../model/property-analysis.js";
import { propertyTimeline } from "../model/property-history.js";
import { displayDate } from "../model/dates.js";
import { personDisplayName } from "../model/person-display.js";
import { propertyRecordDocuments } from "../model/property-document-links.js";
import { sourceChips } from "./components.js";
import { propertyRecordCard } from "./property-history.js";

export const moneyLabel = (value, currency) =>
  `${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 20 }).format(value)} ${currency}`;
const party = (id, external) =>
  personDisplayName(state.project.people.find((p) => p.id === id)) ||
  external ||
  "";
const totals = (values) =>
  Object.entries(values)
    .map(
      ([currency, value]) =>
        `<span class="pill">${esc(moneyLabel(value, currency))}</span>`,
    )
    .join("");

export function propertyInventoryOverview() {
  const summary = propertyInventorySummary(state.project);
  return `<details class="property-inventory-summary"><summary>${t("ui.assetInventorySummary")} · ${summary.groups.length} ${t("ui.assetEconomicGroups")}</summary><p class="hint">${t("ui.assetInventoryHint")}</p><div class="property-snapshot"><section><h3>${t("ui.assetPersonal")}</h3>${totals(summary.totals)}</section><section><h3>${t("ui.assetCorporate")}</h3>${totals(summary.corporateTotals)}</section><section><h3>${t("ui.assetUnclassified")}</h3>${totals(summary.unclassifiedTotals)}</section></div>${summary.excluded ? `<p class="property-record-findings">${t("ui.assetExcluded", { count: summary.excluded })}</p>` : ""}</details>`;
}

export function propertyAssetMap(assets) {
  const visible = new Set(assets.map((a) => a.id));
  return `<section class="property-economic-map"><h2>${t("ui.assetMap")}</h2><p class="hint">${t("ui.assetIdentityHint")}</p>${propertyInventorySummary(
    state.project,
  )
    .groups.filter((g) => g.assets.some((a) => visible.has(a.id)))
    .map(
      (group) =>
        `<article class="asset-chain"><h3>${esc(group.assets[0].economicAssetKey || group.assets[0].title)}</h3>${group.issues.map((code) => `<p class="property-record-findings">${t("ui." + code)}</p>`).join("")}<div class="asset-chain-cards">${group.assets
          .filter((a) => visible.has(a.id))
          .map(
            (asset) =>
              `<section><button class="btn" data-property-history="${asset.id}">${esc(asset.title)}</button><p>${esc([asset.cadastralNumber, asset.registrationNumber, asset.location].filter(Boolean).join(" · "))}</p>${asset.predecessorId ? `<p>${t("ui.assetPredecessor")}: ${esc(state.project.property.find((a) => a.id === asset.predecessorId)?.title)}</p>` : ""}<ol class="asset-transfer-chain">${propertyTimeline(
                asset,
              )
                .filter((entry) => entry.kind === "transfers")
                .map(
                  ({ record }) =>
                    `<li><b>${esc(party(record.fromId, record.fromExternal))} → ${esc(party(record.toId, record.toExternal))}</b><span>${esc(displayDate(record.date))}</span>${sourceChips(propertyRecordDocuments(state.project, asset.id, "transfers", record).map((d) => d.id))}</li>`,
                )
                .join("")}</ol></section>`,
          )
          .join("")}</div></article>`,
    )
    .join("")}</section>`;
}

export function propertyCashFlows(assets, date) {
  const report = cashFlowAnalysis(state.project, assets, date);
  return `<section class="property-cash-flows"><h2>${t("ui.flowMap")}</h2><p class="hint">${t("ui.flowHint")}</p><div class="pills">${totals(report.totals)}</div>${report.rows.map(({ asset, record, sources, duplicate, confirmed }) => `<article class="flow-card"><div class="flow-parties"><b>${esc(party(record.fromId, record.fromExternal))}</b><span aria-hidden="true">→</span><b>${esc(party(record.toId, record.toExternal))}</b></div><p><strong>${esc(moneyLabel(record.amount, record.currency))}</strong> · ${esc(displayDate(record.date))}</p><p>${esc(record.grounds)}</p><span class="pill ${confirmed ? "teal" : "review"}">${t(duplicate ? "ui.flowDuplicate" : confirmed ? "ui.flowConfirmed" : "ui.flowNeedsEvidence")}</span><p><button class="btn small" data-property-history="${asset.id}">${esc(asset.title)}</button> <button class="btn small" data-edit-property-record="${record.id}" data-property-id="${asset.id}" data-property-record-kind="cashFlows">${t("ui.edit")}</button></p>${sourceChips(sources.map((d) => d.id))}</article>`).join("") || `<p class="hint">${t("ui.noRecords")}</p>`}</section>`;
}

export function propertyClaimsOverview(assets) {
  return `<section class="property-claims"><h2>${t("ui.propertyClaims")}</h2><p class="hint">${t("ui.assetClaimsHint")}</p>${assets.flatMap((asset) => (asset.claims || []).map((record) => `<h3><button class="btn small" data-property-history="${asset.id}">${esc(asset.title)}</button></h3>${propertyRecordCard(asset, "claims", record)}`)).join("") || `<p class="hint">${t("ui.propertyNoClaims")}</p>`}</section>`;
}
