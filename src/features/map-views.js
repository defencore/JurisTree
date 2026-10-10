import { clearGraphItems } from "../model/graph-selection.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { uid } from "../core/utils.js";
import { applyCamera } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { resetAnalysis } from "../model/graph-view.js";
import {
  cameraForMapView,
  captureMapView,
  MAP_VIEW_LIMIT,
  restoreMapView,
} from "../model/map-views.js";
import { commit } from "../services/history.js";
import { closeModal, openDialog, toast } from "../ui/dialog.js";
import {
  renderMapViewEditForm,
  renderMapViewsForm,
} from "../ui/forms/map-views.js";

const viewport = () => $("#graph").getBoundingClientRect();
function nameError(form, id = "") {
  const name = String(form.get("map-view-name") || "").trim();
  if (!name) return translate("ui.mapViewNameRequired");
  if (
    state.project.mapViews.some(
      (view) =>
        view.id !== id &&
        view.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  )
    return translate("ui.mapViewNameExists");
  return "";
}

function restore(view) {
  closeModal();
  document.body.classList.remove("mobile-tools-open");
  $("#inspector").classList.remove("open");
  resetAnalysis(false);
  state.comparisonPath = null;
  clearGraphItems(state);
  state.selectionMode = false;
  state.layoutStyle = "";
  commit(() => {
    const saved = restoreMapView(state.project, view),
      visible = saved.visibility;
    state.groupFilter = visible.groupId;
    state.personFilter = visible.personFilter;
    state.showDocs = visible.showDocs;
    state.graphFocus = visible.focus;
    state.analysisHighlight = visible.highlight;
    state.analysisReveal = new Set(visible.revealedRelations);
    state.analysisExpandedGroups = new Set(visible.expandedGroups);
    state.selected = visible.selected;
    state.diagramConnectionKey =
      visible.selected?.kind === "relation" ? "r:" + visible.selected.id : "";
    state.diagramLabelSelection = new Set(
      state.diagramConnectionKey ? [state.diagramConnectionKey] : [],
    );
    state.multiSelection = new Set(visible.selection);
    state.graphSelectionAnchor =
      visible.selected?.kind === "person" ? visible.selected.id : "";
  });
  state.camera = cameraForMapView(view.camera, viewport());
  applyCamera();
  toast(translate("ui.mapViewRestored", { name: view.name }));
}

async function manageView(view) {
  let action;
  const form = await openDialog(
    translate("ui.manageNamedMapView", { name: view.name }),
    renderMapViewEditForm(view),
    {
      kind: "map-view-edit",
      validate: (f) => nameError(f, view.id),
      onOpen: () => {
        $("[data-update-map-view]").onclick = () => {
          const f = new FormData($("#modalForm")),
            error = nameError(f, view.id);
          if (error) {
            $("#modalError").textContent = error;
            return;
          }
          action = {
            type: "update",
            name: String(f.get("map-view-name")).trim(),
          };
          closeModal();
        };
        $("[data-delete-map-view]").onclick = () => {
          action = { type: "delete" };
          closeModal();
        };
      },
    },
  );
  if (!action && !form) return;
  commit(() => {
    if (action?.type === "delete")
      state.project.mapViews = state.project.mapViews.filter(
        (v) => v.id !== view.id,
      );
    else {
      const index = state.project.mapViews.findIndex((v) => v.id === view.id);
      state.project.mapViews[index] =
        action?.type === "update"
          ? captureMapView(state.project, state, viewport(), {
              id: view.id,
              name: action.name,
            })
          : { ...view, name: String(form.get("map-view-name")).trim() };
    }
  });
}

export async function openSavedMapViews() {
  if (state.analysisBusy) return;
  while (true) {
    let choice;
    const form = await openDialog(
      translate("ui.savedMapViews"),
      renderMapViewsForm(state.project.mapViews),
      {
        kind: "map-views",
        submit: translate("ui.saveCurrentMapView"),
        validate: (f) =>
          state.project.mapViews.length >= MAP_VIEW_LIMIT
            ? translate("ui.mapViewLimit", { limit: MAP_VIEW_LIMIT })
            : nameError(f),
        onOpen: () => {
          $(".saved-map-views").onclick = (event) => {
            const button = event.target.closest(
              "[data-restore-view], [data-manage-view]",
            );
            if (!button) return;
            choice = {
              restore: !!button.dataset.restoreView,
              id: button.dataset.restoreView || button.dataset.manageView,
            };
            closeModal();
          };
        },
      },
    );
    if (choice) {
      const view = state.project.mapViews.find((v) => v.id === choice.id);
      if (choice.restore) {
        restore(view);
        return;
      }
      await manageView(view);
      continue;
    }
    if (!form) return;
    const view = captureMapView(state.project, state, viewport(), {
      id: uid(),
      name: String(form.get("map-view-name")).trim(),
    });
    commit(() => state.project.mapViews.push(view));
    toast(translate("ui.mapViewSaved", { name: view.name }));
    return;
  }
}
