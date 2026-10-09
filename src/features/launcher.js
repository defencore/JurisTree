import { startTemplates } from "../core/workspace-modes.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { sample } from "../data/demo.js";
import { fit } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { fresh } from "../model/project.js";
import { launchDraft } from "../model/workspace.js";
import { openDialog } from "../ui/dialog.js";
import { renderCapabilitiesForm } from "../ui/forms/capabilities.js";
import { renderStart } from "../ui/start.js";
import { exportArchive, importFile } from "./archive.js";
import { activateTree, confirmStartReplacement } from "./workspace-session.js";

export function showStartScreen() {
  $("#appShell").hidden = true;
  $("#startScreen").hidden = false;
  $("#sidebar").classList.remove("open");
  $("#inspector").classList.remove("open");
  $("#startError").textContent = "";
  renderStart();
  requestAnimationFrame(() => $("#startHeading").focus());
}
export function selectStartTemplate(key) {
  if (!Object.hasOwn(startTemplates(), key) || appState.startBusy) return;
  const input = $("#startTitle"),
    previous = startTemplates()[appState.startTemplate];
  if (!input.value.trim() || input.value === previous.name)
    input.value = startTemplates()[key].name;
  appState.startTemplate = key;
  renderStart();
}

export async function createFromTemplate() {
  if (!appState.initialized || appState.startBusy) return false;
  const name = $("#startTitle").value.trim();
  if (!name) {
    $("#startError").textContent = translate("ui.enterAMapTitle");
    $("#startTitle").focus();
    return false;
  }
  const t = startTemplates()[appState.startTemplate],
    model = {
      ...fresh(),
      title: name.slice(0, 150),
      purpose: t.purpose,
    };
  if (appState.startTemplate === "blank") model.scopePreferences.family = [];
  if (t.layout) model.graphView.layout = t.layout;
  if (!(await confirmStartReplacement())) return false;
  activateTree(model, new Map(), {
    view: t.view || "tree",
    eventDomain: t.eventDomain || "family",
    eventMode: t.eventMode || "upcoming",
  });
  return true;
}
export async function openDemo() {
  if (!appState.initialized || appState.startBusy) return false;
  if (
    !(await confirmStartReplacement(
      `<p class="hint">${translate("ui.theDemoContainsFictionalPeopleAndExampleSources")}</p>`,
    ))
  )
    return false;
  activateTree(sample());
  return true;
}
export function continueDraft() {
  if (!appState.initialized || appState.startBusy) return false;
  if (appState.editorActive) {
    $("#startScreen").hidden = true;
    $("#appShell").hidden = false;
    requestAnimationFrame(fit);
    return true;
  }
  if (!appState.savedDraft) return false;
  activateTree(
    clone(appState.savedDraft.project),
    new Map(appState.savedDraft.files),
    {
      persist: false,
    },
  );
  return true;
}
export function pickStartImport() {
  if (!appState.initialized || appState.startBusy) return;
  appState.pendingStartImport = true;
  $("#importInput").value = "";
  $("#importInput").click();
}
export async function backupLaunchDraft() {
  const draft = launchDraft();
  if (draft) await exportArchive(draft.project, draft.files);
}
export function coverageHelp() {
  openDialog(
    translate("ui.applicationCapabilitiesAndLimits"),
    renderCapabilitiesForm(),
    {
      wide: true,
      footer: false,
    },
  );
}
export function bindLauncherEvents() {
  $("#startForm").addEventListener("submit", (e) => {
    e.preventDefault();
    createFromTemplate().catch((err) => {
      $("#startError").textContent = err.message;
    });
  });
  $("#startDrop").addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!appState.startBusy) $("#startDrop").classList.add("dragging");
  });
  $("#startDrop").addEventListener("dragleave", () =>
    $("#startDrop").classList.remove("dragging"),
  );
  $("#startDrop").addEventListener("drop", (e) => {
    e.preventDefault();
    $("#startDrop").classList.remove("dragging");
    if (!appState.initialized || appState.startBusy) return;
    const files = [...e.dataTransfer.files];
    if (files.length !== 1) {
      $("#startError").textContent = translate(
        "ui.chooseOneJuristreeZipArchiveOrJsonFile",
      );
      return;
    }
    importFile(files[0], {
      fromStart: true,
    });
  });
}
