import { displayDateTime } from "../model/dates.js";
import { startTemplates } from "../core/workspace-modes.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { launchDraft } from "../model/workspace.js";
import { icon } from "./icons.js";

export function renderStart() {
  const draft = launchDraft(),
    ready = appState.initialized && !appState.startBusy;
  $("#startTemplateGrid").innerHTML = Object.entries(startTemplates())
    .map(
      ([key, t]) =>
        `<button type="button" class="start-template ${key === appState.startTemplate ? "chosen" : ""}" data-start-template="${key}" aria-pressed="${key === appState.startTemplate}" ${ready ? "" : "disabled"}><span class="start-template-icon">${icon(t.icon)}</span><span><b>${t.title}</b><small>${t.description}</small></span><span class="template-check">${icon("check")}</span></button>`,
    )
    .join("");
  $("#startTemplateDetail").textContent =
    startTemplates()[appState.startTemplate].detail;
  $("#startCreate").disabled = !ready;
  $("#startImport").disabled = !ready;
  $("#startDemo").disabled = !ready;
  $("#startResume").hidden = !draft;
  $("#startContinue").disabled = !ready || !draft;
  if (draft) {
    $("#startDraftTitle").textContent = draft.project.title;
    $("#startDraftSummary").textContent =
      `${draft.project.people.length} ${translate("ui.people")} ${draft.project.relations.length} ${translate("ui.relationships2")} ${draft.project.documents.length} ${translate("ui.sources")}`;
    $("#startDraftDate").textContent = appState.editorActive
      ? translate("ui.currentWorkInThisWindow")
      : draft.project.updatedAt &&
          Number.isFinite(Date.parse(draft.project.updatedAt))
        ? `${translate("ui.saved")} ` + displayDateTime(draft.project.updatedAt)
        : translate("ui.draftInThisBrowser");
  }
  $("#startStorageNote").textContent = !appState.initialized
    ? translate("ui.checkingSavedWork")
    : appState.db
      ? translate("ui.draftsAreSavedInThisBrowserExportZip")
      : translate("ui.autosaveIsUnavailableInThisBrowserExportZip");
  $("#startDrop").setAttribute("aria-busy", String(appState.startBusy));
}
