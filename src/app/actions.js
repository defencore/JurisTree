import { moveCalendarMonth } from "../features/calendar.js";
import { localDateString } from "../model/dates.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { editDocument } from "../features/documents.js";
import { editFamilyEvent, renderEvents } from "../features/events.js";
import { editGroup } from "../features/groups.js";
import {
  backupLaunchDraft,
  continueDraft,
  coverageHelp,
  createFromTemplate,
  openDemo,
  pickStartImport,
  showStartScreen,
} from "../features/launcher.js";
import { editPerson, editProject, editScope } from "../features/profiles.js";
import { editProperty } from "../features/property.js";
import { comparePeople, editRelation } from "../features/relationships.js";
import {
  applyGraphAnalysis,
  clearGraphSelection,
  relationShown,
  resetAnalysis,
} from "../graph/analysis.js";
import { fit, focusPerson, zoom } from "../graph/camera.js";
import {
  editGraphFilters,
  graphAnalysisDialog,
  graphHelp,
  renderGraphControls,
  runGraphAnalysis,
} from "../graph/controls.js";
import { arrangeGraph } from "../graph/layout.js";
import { translate } from "../i18n/index.js";
import { exportDialog } from "../services/archive.js";
import { openFiles } from "../services/files.js";
import { redo, undo } from "../services/history.js";
import { render, renderMain } from "../ui/render.js";
export async function newTree() {
  showStartScreen();
}
export async function handleAction(action) {
  const handlers = {
    start: showStartScreen,
    "start-create": createFromTemplate,
    "start-continue": continueDraft,
    "start-demo": openDemo,
    "start-import": pickStartImport,
    "start-backup": backupLaunchDraft,
    coverage: coverageHelp,
    scope: editScope,
    "add-event": () => editFamilyEvent(),
    "add-calendar-event": () =>
      editFamilyEvent(null, null, appState.calendarDay),
    "calendar-previous": () => moveCalendarMonth(-1),
    "calendar-next": () => moveCalendarMonth(1),
    "calendar-today": () => {
      appState.calendarMonth = localDateString().slice(0, 7);
      appState.calendarDay = localDateString();
      renderMain();
    },
    "more-events": () => {
      appState.eventLimit += 80;
      renderEvents();
    },
    compare: comparePeople,
    "add-group": () => editGroup(),
    "clear-comparison": () => {
      appState.comparisonPath = null;
      renderMain();
    },
    "add-person": () => editPerson(),
    "add-relation": () => editRelation(),
    "add-document": () =>
      openFiles(
        appState.selected?.kind === "person"
          ? {
              personId: appState.selected.id,
            }
          : appState.selected?.kind === "relation"
            ? {
                relationId: appState.selected.id,
              }
            : {},
      ),
    reference: () => editDocument(),
    import: () => {
      appState.pendingStartImport = false;
      $("#importInput").value = "";
      $("#importInput").click();
    },
    export: exportDialog,
    undo,
    redo,
    fit,
    "focus-person": () => focusPerson(),
    "mobile-tools": () => {
      const open = document.body.classList.toggle("mobile-tools-open");
      $('[data-action="mobile-tools"]').setAttribute(
        "aria-expanded",
        String(open),
      );
    },
    "touch-move": () => {
      appState.touchMove = !appState.touchMove;
      renderGraphControls();
    },
    layout: () => arrangeGraph(),
    "graph-search": () => graphAnalysisDialog(),
    "graph-help": graphHelp,
    "graph-filters": editGraphFilters,
    "run-graph-analysis": runGraphAnalysis,
    "selection-mode": () => {
      appState.selectionMode = !appState.selectionMode;
      renderGraphControls();
    },
    "clear-selection": clearGraphSelection,
    "clear-analysis": () => {
      resetAnalysis();
      appState.multiSelection.clear();
      render();
      fit();
    },
    "focus-selection": () => {
      const people = [...appState.multiSelection],
        set = new Set(people);
      const relations = appState.project.relations
        .filter((r) => set.has(r.from) && set.has(r.to) && relationShown(r))
        .map((r) => r.id);
      applyGraphAnalysis(
        {
          people,
          relations,
        },
        translate("ui.selectedPeople"),
        true,
      );
    },
    "zoom-in": () => zoom(1.2),
    "zoom-out": () => zoom(1 / 1.2),
    "toggle-docs": () => {
      appState.showDocs = !appState.showDocs;
      renderMain();
      fit();
    },
    new: newTree,
    project: editProject,
    "add-property": () => editProperty(),
    menu: () => {
      $("#inspector").classList.remove("open");
      $("#sidebar").classList.toggle("open");
    },
    "close-mobile-panels": () => {
      $("#sidebar").classList.remove("open");
      $("#inspector").classList.remove("open");
    },
    "close-panel": () => $("#inspector").classList.remove("open"),
  };
  if (handlers[action]) await handlers[action]();
}
