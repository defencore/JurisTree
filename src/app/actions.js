import { closeMapPanels } from "../ui/map-panels.js";
import {
  closeInspector,
  toggleInspector,
  toggleNavigation,
} from "../features/workspace-controls.js";
import { renderDiagramTools } from "../ui/diagram-tools.js";
import { clearGraphItems } from "../model/graph-selection.js";
import { setPlacementLocked } from "../features/placement-locks.js";
import {
  toggleDiagramTools,
  changeDiagramSetting,
  beginRoutePoint,
  removeRoutePoint,
  changeRouteStyle,
  resetDiagramLabels,
} from "../features/diagram.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { exportDialog } from "../features/archive.js";
import { openFiles } from "../features/attachments.js";
import { updateBiographyReview } from "../features/biography-review.js";
import { moveCalendarPeriod } from "../features/calendar.js";
import { editDocument } from "../features/documents.js";
import {
  focusDirectConnections,
  restoreConnectionMap,
} from "../features/direct-connections.js";
import { editFamilyEvent } from "../features/events.js";
import {
  applyGraphAnalysis,
  clearGraphSelection,
  toggleSelectionMode,
} from "../features/graph-analysis.js";
import {
  editGraphFilters,
  graphAnalysisDialog,
  graphHelp,
  runGraphAnalysis,
} from "../features/graph-tools.js";
import {
  editGroup,
  openGroupVisibility,
  setGroupsCollapsed,
} from "../features/groups.js";
import { openSavedMapViews } from "../features/map-views.js";
import {
  backupLaunchDraft,
  continueDraft,
  coverageHelp,
  createFromTemplate,
  openDemo,
  pickStartImport,
  showStartScreen,
} from "../features/launcher.js";
import {
  clearPersonFilters,
  editPersonFilters,
} from "../features/person-filters.js";
import { editPerson, editProject, editScope } from "../features/profiles.js";
import { editProperty } from "../features/property.js";
import { comparePeople, editRelation } from "../features/relationships.js";
import { openUserGuide, downloadGuideExample } from "../features/user-guide.js";
import { fit, focusPerson, zoom } from "../graph/camera.js";
import { arrangeGraph } from "../graph/layout.js";
import { translate } from "../i18n/index.js";
import { localDateString } from "../model/dates.js";
import {
  graphView,
  relationShown,
  resetAnalysis,
} from "../model/graph-view.js";
import { redo, undo } from "../services/history.js";
import { renderGraphControls } from "../ui/graph-controls.js";
import { render, renderMain } from "../ui/render.js";
import { closeSearch, renderSearch } from "../ui/search.js";
import { renderCalendar } from "../ui/workspaces/calendar.js";
import { renderEvents } from "../ui/workspaces/events.js";

export async function newTree() {
  showStartScreen();
}
export async function handleAction(action) {
  if (
    ["direct-connections", "restore-connection-map", "layout"].includes(action)
  )
    closeMapPanels();
  const handlers = {
    "user-guide": openUserGuide,
    "download-guide-example": downloadGuideExample,
    "person-filters": editPersonFilters,
    "clear-person-filters": clearPersonFilters,
    "update-biography-review": updateBiographyReview,
    "close-search": closeSearch,
    "clear-search": () => {
      $("#globalSearch").value = "";
      closeSearch();
      $("#globalSearch").focus();
    },
    "more-search": () => {
      appState.searchLimit += 20;
      renderSearch();
    },
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
    "more-calendar-dates": () => {
      appState.calendarUndatedLimit += 80;
      renderCalendar();
    },
    "calendar-previous": () => moveCalendarPeriod(-1),
    "calendar-next": () => moveCalendarPeriod(1),
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
    "group-visibility": openGroupVisibility,
    "lock-placement": () => setPlacementLocked(true),
    "unlock-placement": () => setPlacementLocked(false),
    "diagram-tools": toggleDiagramTools,
    "toggle-grid": () =>
      changeDiagramSetting("showGrid", !graphView().showGrid),
    "diagram-add-point": beginRoutePoint,
    "diagram-remove-point": () => removeRoutePoint(),
    "diagram-reset-route": () => changeRouteStyle("auto"),
    "diagram-reset-label": resetDiagramLabels,
    "expand-all-groups": () =>
      setGroupsCollapsed(
        appState.project.groups.map((group) => group.id),
        false,
      ),
    "collapse-all-groups": () =>
      setGroupsCollapsed(
        appState.project.groups.map((group) => group.id),
        true,
      ),
    "clear-comparison": () => {
      appState.comparisonPath = null;
      renderMain();
    },
    "add-person": () => editPerson(),
    "add-relation": () => editRelation(),
    "link-selected": () => editRelation(),
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
    "direct-connections": focusDirectConnections,
    "restore-connection-map": restoreConnectionMap,
    "toggle-inspector": toggleInspector,
    "diagram-panel": () => {
      if (!appState.diagramEditing) toggleDiagramTools();
      else {
        appState.diagramPanelOpen = !appState.diagramPanelOpen;
        renderDiagramTools();
      }
    },
    "minimize-diagram": () => {
      appState.diagramPanelOpen = false;
      renderDiagramTools();
    },
    "touch-move": () => {
      appState.touchMove = !appState.touchMove;
      renderGraphControls();
    },
    layout: () => arrangeGraph(),
    "graph-search": () => graphAnalysisDialog(),
    "graph-help": graphHelp,
    "graph-filters": editGraphFilters,
    "saved-map-views": openSavedMapViews,
    "run-graph-analysis": runGraphAnalysis,
    "selection-mode": toggleSelectionMode,
    "clear-selection": clearGraphSelection,
    "clear-analysis": () => {
      resetAnalysis();
      clearGraphItems(appState);
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
    menu: toggleNavigation,
    "close-mobile-panels": () => {
      $("#sidebar").classList.remove("open");
      $("#inspector").classList.remove("open");
    },
    "close-panel": closeInspector,
  };
  if (handlers[action]) await handlers[action]();
}
