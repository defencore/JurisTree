import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import {
  directConnectionScope,
  graphView,
  relationShown,
} from "../model/graph-view.js";
import { group, person } from "../model/lookup.js";
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
  ]);

export async function arrangeGraph(style = graphView().layout) {
  if (appState.analysisBusy) return;
  const start = appState.project,
    updatedAt = appState.project.updatedAt,
    scopeKey = layoutScopeKey(),
    direct = directConnectionScope(),
    cfg = graphView();
  appState.analysisBusy = true;
  renderGraphControls();
  try {
    let positions;
    if (style === "generations")
      positions = familyLayout(
        direct
          ? {
              ...start,
              people: start.people.filter((p) => direct.people.has(p.id)),
              relations: start.relations.filter((r) =>
                direct.relations.has(r.id),
              ),
              documents: [],
              property: [],
            }
          : start,
      );
    else {
      const nodes = filteredGraphNodes().filter((n) =>
        ["person", "group"].includes(n.kind),
      );
      if (!nodes.length) {
        toast(translate("ui.noPeopleToArrange"));
        return;
      }
      const rs = withProjectIndex(() =>
        appState.project.relations.filter((r) => relationShown(r)),
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
    if (direct)
      positions.people = positionScopedLayout(positions.people, start, direct);
    commit(() => {
      appState.project.graphView = {
        ...cfg,
        layout: style,
      };
      for (const [id, pos] of positions.people) {
        const p = person(id);
        if (p) Object.assign(p, pos);
        else {
          const g = group(id);
          if (g) {
            const members = appState.project.people.filter((p) =>
                (p.groupIds || []).includes(id),
              ),
              dx =
                pos.x -
                (Number.isFinite(g.x)
                  ? g.x
                  : Math.min(...members.map((p) => p.x))),
              dy =
                pos.y -
                (Number.isFinite(g.y)
                  ? g.y
                  : Math.min(...members.map((p) => p.y)));
            members.forEach((p) => {
              p.x += dx;
              p.y += dy;
            });
            Object.assign(g, pos);
          }
        }
      }
      if (direct) return;
      if (style === "generations") {
        appState.project.groups.forEach((g) => {
          g.x = null;
          g.y = null;
        });
        appState.project.documents.forEach((d) =>
          Object.assign(d, positions.documents.get(d.id)),
        );
        appState.project.property.forEach((a) =>
          Object.assign(a, positions.property.get(a.id)),
        );
      } else {
        const right = Math.max(
            1100,
            ...appState.project.people.map((p) => p.x + PERSON_CARD_WIDTH),
          ),
          bottom = Math.max(
            0,
            ...appState.project.people.map((p) => p.y + PERSON_CARD_HEIGHT),
          ),
          cols = Math.max(1, Math.min(20, Math.floor(right / 265)));
        appState.project.documents.forEach((d, i) =>
          Object.assign(d, {
            x: 55 + (i % cols) * 265,
            y: bottom + 100 + Math.floor(i / cols) * 170,
          }),
        );
        appState.project.property.forEach((a, i) =>
          Object.assign(a, {
            x: 55 + (i % cols) * 265,
            y:
              bottom +
              100 +
              Math.ceil(appState.project.documents.length / cols) * 170 +
              Math.floor(i / cols) * 170,
          }),
        );
      }
    });
    fit();
  } catch (error) {
    toast(error.message, true);
  } finally {
    appState.analysisBusy = false;
    renderGraphControls();
  }
}
