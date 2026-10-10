import { layoutTypes } from "../core/layouts.js";
import { state } from "../core/state.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import { layoutInput } from "../graph/layouts/input.js";
import { translate as t } from "../i18n/index.js";
import {
  directConnectionScope,
  graphView,
  relationShown,
} from "../model/graph-view.js";
import { typeOptions } from "./components.js";
import { icon } from "./icons.js";

export function layoutControls() {
  const cfg = graphView(),
    input = layoutInput(state.project, filteredGraphNodes(), state, {
      direct: directConnectionScope(),
      relationIds: new Set(
        state.project.relations
          .filter((relation) => relationShown(relation))
          .map((relation) => relation.id),
      ),
      documentLinks: cfg.documentLinks,
      propertyLinks: cfg.propertyLinks,
    }),
    busy = state.analysisBusy,
    movable = input.nodes.filter((node) => !node.locked).length;
  return `<div class="layout-controls" role="group" aria-label="${t("ui.mapLayout")}"><label class="layout-control"><span>${t("ui.layoutScope")}</span><select id="graphLayoutScope" ${busy ? "disabled" : ""}><option value="selected" ${input.scope === "selected" ? "selected" : ""} ${!input.hasSelection ? "disabled" : ""}>${t("ui.layoutSelected", { count: input.selectedCount })}</option><option value="visible" ${input.scope === "visible" ? "selected" : ""}>${t("ui.layoutVisible")}</option></select></label><label class="layout-control"><span>${t("ui.layoutMethod")}</span><select id="graphLayout" aria-label="${t("ui.mapLayout")}" ${busy ? "disabled" : ""}>${typeOptions(Object.fromEntries(Object.entries(layoutTypes).map(([key, label]) => [key, t(label)])), state.layoutStyle || cfg.layout)}</select></label><button class="btn small primary" data-action="layout" ${busy || !movable ? "disabled" : ""}>${icon("layout")}${t(busy ? "ui.layoutRunning" : "ui.applyLayout")}</button><small class="layout-scope-hint">${t("ui.layoutScopeHint", { count: input.nodes.length, fixed: input.nodes.length - movable })}</small></div>`;
}
