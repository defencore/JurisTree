import { importFile } from "../services/archive.js";
import { renderCapabilitiesForm } from "../ui/forms/capabilities.js";
import { getLocale } from "../i18n/index.js";
import { startTemplates } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { sample } from "../data/demo.js";
import { resetAnalysis } from "../graph/analysis.js";
import { fit, focusPerson } from "../graph/camera.js";
import { isMobileLayout } from "../core/viewport.js";
import { translate } from "../i18n/index.js";
import { fresh } from "../model/project.js";
import { exportArchive } from "../services/archive.js";
import { checkpoint } from "../services/history.js";
import { scheduleSave } from "../services/storage.js";
import { openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
import { render } from "../ui/render.js";
export function launchDraft() {
  return appState.editorActive
    ? {
        project: appState.project,
        files: appState.blobs,
      }
    : appState.savedDraft;
}
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
        ? `${translate("ui.saved")} ` +
          new Date(draft.project.updatedAt).toLocaleString(getLocale())
        : translate("ui.draftInThisBrowser");
  }
  $("#startStorageNote").textContent = !appState.initialized
    ? translate("ui.checkingSavedWork")
    : appState.db
      ? translate("ui.draftsAreSavedInThisBrowserExportZip")
      : translate("ui.autosaveIsUnavailableInThisBrowserExportZip");
  $("#startDrop").setAttribute("aria-busy", String(appState.startBusy));
}
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
export async function confirmStartReplacement(summary = "") {
  const draft = launchDraft();
  if (!draft) return true;
  const f = await openDialog(
    translate("ui.openAnotherMap"),
    `${summary}<p class="hint">${translate("ui.theCurrentDraft")}${esc(draft.project.title)}${translate("ui.willBeReplacedExportAnArchiveToKeep")}</p><button type="button" class="btn" data-action="start-backup">${icon("archive")}${translate("ui.downloadCurrentDraftZip")}</button>`,
    {
      submit: translate("ui.openAnotherMap2"),
    },
  );
  return !!f;
}
export function activateTree(
  model,
  files = new Map(),
  { persist = true } = {},
) {
  if (appState.editorActive) checkpoint();
  else {
    appState.history = [];
    appState.future = [];
  }
  resetAnalysis(false);
  appState.multiSelection.clear();
  appState.selectionMode = false;
  appState.touchMove = false;
  document.body.classList.remove("mobile-tools-open");
  appState.project = model;
  for (const [id, b] of files) appState.blobs.set(id, b);
  appState.editorActive = true;
  appState.savedDraft = null;
  appState.view = "tree";
  appState.groupFilter = "";
  appState.comparisonPath = null;
  appState.docFilter = "";
  appState.docTypeFilter = "";
  appState.docStatusFilter = "";
  appState.docFileFilter = "";
  appState.docShowAll = false;
  appState.showDocs = false;
  appState.eventSearch = "";
  appState.eventType = "";
  appState.calendarMonth = "";
  appState.calendarDay = "";
  appState.calendarSearch = "";
  appState.calendarType = "";
  appState.eventMode = "upcoming";
  appState.eventLimit = 80;
  appState.camera = {
    x: 0,
    y: 0,
    z: 1,
  };
  $("#peopleSearch").value = "";
  $("#sidebar").classList.remove("open");
  $("#inspector").classList.remove("open");
  appState.selected = appState.project.people.length
    ? {
        kind: "person",
        id: appState.project.claimantId || appState.project.people[0].id,
      }
    : null;
  $("#startScreen").hidden = true;
  $("#appShell").hidden = false;
  $("#startError").textContent = "";
  render();
  requestAnimationFrame(() => (isMobileLayout() ? focusPerson() : fit()));
  if (persist) scheduleSave();
  else
    $("#saveState").innerHTML = icon("check") + translate("ui.draftOnDevice");
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
  if (appState.startTemplate === "research") model.graphView.layout = "network";
  if (!(await confirmStartReplacement())) return false;
  activateTree(model);
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
