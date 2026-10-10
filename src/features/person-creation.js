import { clearGraphItems } from "../model/graph-selection.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { uid } from "../core/utils.js";
import { isMobileLayout } from "../core/viewport.js";
import { focusPerson } from "../graph/camera.js";
import { newPersonPosition } from "../graph/person-placement.js";
import { localDateString } from "../model/dates.js";
import { edgeState } from "../model/evidence.js";
import { graphView, resetAnalysis } from "../model/graph-view.js";
import { resetPersonFilter } from "../model/person-filter-state.js";
import { evaluatePersonFilter } from "../model/person-filters.js";
import { commit } from "../services/history.js";

export function createPerson(data, id, links) {
  const position = newPersonPosition(id, links);
  commit(() => {
    state.project.people.push({ ...data, id, avatarId: "", ...position });
    state.project.relations.push(...links.map((r) => ({ ...r, id: uid() })));
    resetAnalysis(false);
    clearGraphItems(state);
    state.graphSelectionAnchor = id;
    state.comparisonPath = null;
    if (state.groupFilter && !data.groupIds.includes(state.groupFilter))
      state.groupFilter = "";
    if (
      state.personFilter.rules.length &&
      !evaluatePersonFilter(state.project, state.personFilter, {
        today: localDateString(),
        files: state.blobs,
        groupId: state.groupFilter,
      }).ids.has(id)
    )
      resetPersonFilter();
    for (const group of state.project.groups)
      if (data.groupIds.includes(group.id)) group.collapsed = false;
    if (links.length) {
      const cfg = graphView();
      cfg.types = [...new Set([...cfg.types, ...links.map((r) => r.type)])];
      cfg.states = [...new Set([...cfg.states, ...links.map(edgeState)])];
      state.project.graphView = cfg;
    }
    state.selected = { kind: "person", id };
    if (state.view === "people") state.profileFocus = id;
  });
  if (state.view === "tree") {
    $(".legend").open = false;
    if (innerWidth <= 1050) $("#inspector").classList.remove("open");
    if (isMobileLayout()) {
      $("#sidebar").classList.remove("open");
    }
    document.body.classList.remove("mobile-tools-open");
    focusPerson(id);
  }
}
