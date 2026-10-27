import { propertyDetailsConfig } from "../core/property-details.js";
import { state } from "../core/state.js";
import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import { economicAssetGroups } from "../model/property-analysis.js";
import { fields, recordValues } from "./profile-fields.js";
import { sourceChips } from "./components.js";

export function propertyDossier(asset) {
  const group = economicAssetGroups(state.project).find((g) =>
    g.assets.some((a) => a.id === asset.id),
  );
  const related = group?.assets.filter((a) => a.id !== asset.id) || [];
  const documents = state.project.documents.filter(
    (d) =>
      d.id === asset.sourceId ||
      d.propertyIds?.includes(asset.id) ||
      d.propertyRecordLinks?.some((link) => link.propertyId === asset.id),
  );
  return `<details class="property-dossier" open><summary>${t("ui.assetDossier")}</summary>${fields(recordValues(propertyDetailsConfig(), asset))}${asset.predecessorId ? `<p>${t("ui.assetPredecessor")}: <button class="btn small" data-property-history="${esc(asset.predecessorId)}">${esc(state.project.property.find((a) => a.id === asset.predecessorId)?.title)}</button></p>` : ""}${related.length ? `<h3>${t("ui.assetRelatedCards")}</h3><div class="property-card-actions">${related.map((a) => `<button class="btn small" data-property-history="${a.id}">${esc(a.title)}</button>`).join("")}</div>` : ""}${group?.issues.length ? `<ul class="property-record-findings">${group.issues.map((code) => `<li>${t("ui." + code)}</li>`).join("")}</ul>` : ""}<h3>${t("ui.propertyEvidence")}</h3>${sourceChips(documents.map((d) => d.id))}<button class="btn small" data-asset-source="${asset.id}">${t("ui.addSource")}</button></details>`;
}
