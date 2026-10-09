import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { person } from "../model/lookup.js";
import { icon } from "../ui/icons.js";
import { graphRoleGroups } from "./roles.js";

export function renderGraphRoleLegend() {
  const selected =
    person(state.directConnectionRoot) ||
    (state.selected?.kind === "person" && person(state.selected.id));
  const context = $("#graphRoleContext");
  context.hidden = !selected;
  context.innerHTML = selected
    ? `<span class="role-reference" title="${esc(t("ui.graphRelativeTo", { name: selected.name }))}">${icon("users")}<b>${esc(t("ui.graphRelativeTo", { name: selected.name }))}</b></span>`
    : "";
  if (!selected) return "";
  return `<section class="graph-role-legend"><p class="legend-group-label">${esc(t("ui.graphRelativeTo", { name: selected.name }))}</p><div class="legend-states">${Object.entries(
    graphRoleGroups,
  )
    .map(
      ([key, group]) =>
        `<span data-legend-role="${key}"><svg class="role-sample" viewBox="0 0 24 20" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="3" fill="${group.bg}" stroke="${group.color}" stroke-width="1.7"/></svg>${t(group.label)}</span>`,
    )
    .join(
      "",
    )}</div><p class="legend-note">${t("ui.graphRoleNote")}</p></section>`;
}
