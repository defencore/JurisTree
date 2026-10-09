import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { personFilterReport } from "../model/person-filter-state.js";

export function renderPersonFilterBar() {
  const count = state.personFilter.rules.length;
  $("#personFilterCount").textContent = count || "";
  $('[data-action="person-filters"]').setAttribute(
    "aria-pressed",
    String(count > 0),
  );
  const bar = $("#personFilterBar");
  bar.hidden = !count;
  if (!count) {
    bar.innerHTML = "";
    return;
  }
  const report = personFilterReport();
  bar.innerHTML = `<span>${t("ui.filterActiveResults")} <b>${report.matches.length} / ${report.total}</b> · ${t("ui.filterConditionCount")} ${count}</span><div><button type="button" class="btn small" data-action="person-filters">${t("ui.edit")}</button><button type="button" class="btn small ghost" data-action="clear-person-filters">${t("ui.filterReset")}</button></div>${!report.matches.length ? `<p>${t("ui.filterNoMatches")}</p>` : ""}`;
}
