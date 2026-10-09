import { layoutProject } from "./layouts/apply.js";
import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import {
  directConnectionScope,
  graphView,
  relationShown,
  visiblePeople,
} from "../model/graph-view.js";
import { withProjectIndex } from "../model/project.js";
import { commit } from "../services/history.js";
import { toast } from "../ui/dialog.js";
import { renderGraphControls } from "../ui/graph-controls.js";
import { fit } from "./camera.js";
import { familyLayout } from "./layouts/family.js";
import { circularLayout, networkLayout } from "./layouts/network.js";
import { positionScopedLayout } from "./layouts/scoped.js";
import { filteredGraphNodes } from "./node-data.js";

const layoutScopeKey = () =>
  JSON.stringify([
    appState.groupFilter,
    appState.graphFocus?.people || [],
    appState.directConnectionRoot,
    visiblePeople().map((person) => person.id),
  ]);

export async function arrangeGraph(style = graphView().layout) {
  if (appState.analysisBusy) return;
  const start = appState.project,
    updatedAt = appState.project.updatedAt,
    scopeKey = layoutScopeKey(),
    direct = directConnectionScope(),
    cfg = graphView();
  const shown = visiblePeople().filter(
      (person) => !direct || direct.people.has(person.id),
    ),
    ids = new Set(shown.map((person) => person.id)),
    partial =
      direct || appState.groupFilter || shown.length !== start.people.length,
    scope =
      partial && shown.length
        ? {
            people: ids,
            rootId: ids.has(direct?.rootId)
              ? direct.rootId
              : ids.has(appState.selected?.id)
                ? appState.selected.id
                : shown[0].id,
          }
        : null;
  if (!shown.length) {
    toast(translate("ui.noPeopleToArrange"));
    return;
  }
  appState.analysisBusy = true;
  renderGraphControls();
  try {
    let positions;
    if (style === "generations")
      positions = familyLayout(
        scope
          ? {
              ...start,
              people: shown,
              relations: start.relations.filter(
                (r) =>
                  ids.has(r.from) &&
                  ids.has(r.to) &&
                  (!direct || direct.relations.has(r.id)),
              ),
              documents: [],
              property: [],
            }
          : start,
      );
    else {
      const nodes = (
        scope
          ? shown.map((person) => ({
              ...person,
              kind: "person",
              w: PERSON_CARD_WIDTH,
              h: PERSON_CARD_HEIGHT,
            }))
          : filteredGraphNodes()
      ).filter((n) => ["person", "group"].includes(n.kind));
      if (!nodes.length) {
        toast(translate("ui.noPeopleToArrange"));
        return;
      }
      const rs = withProjectIndex(() =>
        appState.project.relations.filter(
          (r) =>
            relationShown(r) &&
            (!scope || (ids.has(r.from) && ids.has(r.to))) &&
            (!direct || direct.relations.has(r.id)),
        ),
      );
      const ps =
        style === "circle"
          ? circularLayout(nodes)
          : await networkLayout(nodes, rs);
      positions = {
        people: ps,
        documents: new Map(),
        property: new Map(),
      };
    }
    if (
      appState.project !== start ||
      appState.project.updatedAt !== updatedAt ||
      layoutScopeKey() !== scopeKey
    ) {
      toast(translate("ui.treeChangedDuringLayoutTryAgain"));
      return;
    }
    if (scope)
      positions.people = positionScopedLayout(positions.people, start, scope);
    const next = layoutProject(start, positions, {
      cfg,
      style,
      scope,
      groupFilter: appState.groupFilter,
      direct,
    });
    commit(() => {
      appState.project = next;
    });
    fit(
      scope
        ? filteredGraphNodes().filter((node) =>
            node.kind === "person"
              ? scope.people.has(node.id)
              : node.kind === "group" &&
                node.members.some((id) => scope.people.has(id)),
          )
        : undefined,
    );
  } catch (error) {
    toast(error.message, true);
  } finally {
    appState.analysisBusy = false;
    renderGraphControls();
  }
}
