import { $ } from "../core/dom.js";
import { isMobileLayout } from "../core/viewport.js";
import { layoutTypes } from "../core/layouts.js";
import { state } from "../core/state.js";
import { translate } from "../i18n/index.js";
import {
  directConnectionScope,
  graphView,
  relationShown,
} from "../model/graph-view.js";
import { withProjectIndex } from "../model/project.js";
import { projectVersion } from "../model/project-revision.js";
import { nodeKey } from "../model/graph-selection.js";
import { commit } from "../services/history.js";
import { toast } from "../ui/dialog.js";
import { renderGraphControls } from "../ui/graph-controls.js";
import { fit } from "./camera.js";
import { filteredGraphNodes } from "./node-data.js";
import { layoutInput } from "./layouts/input.js";
import { computeLayout } from "./layouts/compute.js";
import { applyLayout } from "./layouts/placement.js";

export function currentLayoutInput() {
  return withProjectIndex(() =>
    layoutInput(state.project, filteredGraphNodes(), state, {
      direct: directConnectionScope(),
      documentLinks: graphView().documentLinks,
      propertyLinks: graphView().propertyLinks,
      relationIds: new Set(
        state.project.relations
          .filter((relation) => relationShown(relation))
          .map((relation) => relation.id),
      ),
    }),
  );
}
const scopeKey = (input) =>
  JSON.stringify([
    state.groupFilter,
    state.directConnectionRoot,
    state.layoutScope,
    input.nodes.map((node) => node.key),
    input.links.map((link) => link.key),
  ]);

export async function arrangeGraph(
  style = state.layoutStyle || graphView().layout,
) {
  if (state.analysisBusy) return;
  if (!Object.hasOwn(layoutTypes, style)) {
    toast(translate("ui.invalidLayout"), true);
    return;
  }
  const start = state.project,
    version = projectVersion(start),
    cfg = graphView(),
    input = currentLayoutInput(),
    signature = scopeKey(input);
  if (!input.nodes.length || input.nodes.every((node) => node.locked)) {
    toast(
      translate(
        input.nodes.length ? "ui.layoutAllFixed" : "ui.noCardsToArrange",
      ),
    );
    return;
  }
  state.analysisBusy = true;
  renderGraphControls();
  try {
    const rootKey = state.selected && nodeKey(state.selected),
      positions = await computeLayout(
        input,
        style,
        rootKey,
        () => new Promise(requestAnimationFrame),
      );
    if (
      state.project !== start ||
      projectVersion(start) !== version ||
      scopeKey(currentLayoutInput()) !== signature
    ) {
      toast(translate("ui.treeChangedDuringLayoutTryAgain"));
      return;
    }
    const next = applyLayout(start, input, positions, style, cfg);
    state.layoutStyle = style;
    if (innerWidth < 1440) {
      if (isMobileLayout()) document.body.classList.remove("mobile-tools-open");
      $(".diagram-layout-settings")?.removeAttribute("open");
      $(".graph-layout-settings")?.removeAttribute("open");
    }
    commit(() => {
      state.project = next;
    });
    const keys = new Set(input.nodes.map((node) => node.key));
    fit(filteredGraphNodes().filter((node) => keys.has(nodeKey(node))));
  } catch (error) {
    toast(error.message, true);
  } finally {
    state.analysisBusy = false;
    renderGraphControls();
  }
}
