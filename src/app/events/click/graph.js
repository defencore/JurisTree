import { state as appState } from "../../../core/state.js";
import {
  applyGraphPreset,
  hideGraphRelation,
  revealGraphRelation,
  showAnalysisResult,
} from "../../../features/graph-analysis.js";
import { graphAnalysisDialog } from "../../../features/graph-tools.js";
import {
  deleteGroup,
  editGroup,
  toggleGroup,
} from "../../../features/groups.js";
import { editRelation } from "../../../features/relationships.js";
import { fit } from "../../../graph/camera.js";
import { commit } from "../../../services/history.js";
import { closeModal } from "../../../ui/dialog.js";
import { select } from "../../../ui/render.js";

export const graphClicks = [
  {
    priority: 26,
    matches: (b) => b.dataset.analysisMode,
    run: async (b) => {
      graphAnalysisDialog(b.dataset.analysisMode);
    },
  },
  {
    priority: 27,
    matches: (b) => b.hasAttribute("data-analysis-path"),
    run: async (b) => {
      showAnalysisResult(
        Number(b.dataset.analysisPath),
        b.dataset.analysisFocus === "true",
      );
    },
  },
  {
    priority: 28,
    matches: (b) => b.hasAttribute("data-analysis-result"),
    run: async (b) => {
      showAnalysisResult(null, b.dataset.analysisFocus === "true");
    },
  },
  {
    priority: 29,
    matches: (b) => b.dataset.graphPreset,
    run: async (b) => {
      closeModal();
      applyGraphPreset(b.dataset.graphPreset);
    },
  },
  {
    priority: 30,
    matches: (b) => b.dataset.hideGraphRelation,
    run: async (b) => {
      hideGraphRelation(b.dataset.hideGraphRelation);
    },
  },
  {
    priority: 31,
    matches: (b) => b.dataset.revealGraphRelation,
    run: async (b) => {
      revealGraphRelation(b.dataset.revealGraphRelation);
    },
  },
  {
    priority: 40,
    matches: (b) => b.dataset.editGroup,
    run: async (b) => {
      await editGroup(b.dataset.editGroup);
    },
  },
  {
    priority: 41,
    matches: (b) => b.dataset.toggleGroup,
    run: async (b) => {
      toggleGroup(b.dataset.toggleGroup);
    },
  },
  {
    priority: 42,
    matches: (b) => b.dataset.deleteGroup,
    run: async (b) => {
      await deleteGroup(b.dataset.deleteGroup);
    },
  },
  {
    priority: 43,
    matches: (b) => b.dataset.addKin,
    run: async (b) => {
      const id = b.dataset.kinPerson,
        other = appState.project.people.find((p) => p.id !== id)?.id;
      const type =
        b.dataset.addKin === "partners"
          ? "spouse"
          : b.dataset.addKin === "professional"
            ? "professional"
            : b.dataset.addKin === "other"
              ? "acquaintance"
              : "parent";
      await editRelation(
        null,
        b.dataset.addKin === "parents"
          ? {
              from: other,
              to: id,
              type,
            }
          : {
              from: id,
              to: other,
              type,
            },
      );
    },
  },
  {
    priority: 50,
    matches: (b) => b.hasAttribute("data-show-kin-path"),
    run: async (_b) => {
      if (!appState.currentKinResult?.found) return;
      appState.comparisonPath = {
        people: appState.currentKinResult.people,
        relations: appState.currentKinResult.relations,
      };
      appState.groupFilter = "";
      appState.selected = {
        kind: "person",
        id: appState.currentKinResult.from,
      };
      appState.view = "tree";
      closeModal();
      commit(() => {
        appState.project.groups.forEach((g) => {
          if (
            appState.project.people.some(
              (p) =>
                appState.comparisonPath.people.includes(p.id) &&
                (p.groupIds || []).includes(g.id),
            )
          )
            g.collapsed = false;
        });
      });
      fit();
    },
  },
  {
    priority: 55,
    matches: (b) => b.dataset.relation || b.dataset.edge,
    run: async (b) => {
      select("relation", b.dataset.relation || b.dataset.edge);
    },
  },
];
