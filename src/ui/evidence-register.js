import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import { evidenceRegisterRows } from "../model/evidence-register.js";
import { statusBadge } from "./components.js";

export function renderEvidenceRegister(sources) {
  const rows = evidenceRegisterRows(sources);
  return `<section class="evidence-register"><p class="hint">${t("ui.evidenceRegisterHint")}</p><button class="btn small" data-action="export-evidence">${t("ui.evidenceExport")}</button><div class="doc-table-wrap"><table class="doc-table"><thead><tr>${["ui.source", "ui.evidenceCustodian", "ui.documentCopyKind", "ui.evidenceFact", "ui.evidenceRoute", "ui.evidenceInventory", "ui.sourceProvenance"].map((key) => `<th>${t(key)}</th>`).join("")}</tr></thead><tbody>${sources
    .map((source, index) => {
      const row = rows[index];
      return `<tr><td><button data-document="${source.id}">${esc(source.title)}</button><small>${esc(row[2])}</small>${statusBadge(source)}</td>${[3, 4, 5, 6, 7, 11].map((i) => `<td>${esc(row[i])}</td>`).join("")}</tr>`;
    })
    .join("")}</tbody></table></div></section>`;
}
