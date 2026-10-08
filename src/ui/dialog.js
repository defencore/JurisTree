import { recordConfigs } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { commit, repairSelection } from "../services/history.js";
import { icons } from "./icons.js";
export function toast(message, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.className = "toast visible" + (error ? " error" : "");
  clearTimeout(appState.toastTimer);
  appState.toastTimer = setTimeout(() => el.classList.remove("visible"), 6000);
}
export function closeModal() {
  const resolve = appState.modalResolve;
  appState.modalResolve = null;
  if ($("#modal").open) $("#modal").close();
  if (resolve) resolve(null);
}
export function openDialog(
  title,
  html,
  {
    submit = translate("ui.save"),
    wide = false,
    footer = true,
    validate = null,
  } = {},
) {
  if ($("#modal").open) closeModal();
  $("#modal").classList.toggle("wide", wide);
  $("#modalTitle").textContent = title;
  $("#modalContent").innerHTML = html;
  $("#modalError").textContent = "";
  $("#modalFooter").innerHTML = footer
    ? `<button type="button" class="btn" data-close>${translate("ui.cancel")}</button><button class="btn primary" type="submit">${esc(submit)}</button>`
    : `<button type="button" class="btn" data-close>${translate("ui.close")}</button>`;
  $("#modal").showModal();
  $("#modal .modal-body").scrollTop = 0;
  icons();
  return new Promise((resolve) => {
    appState.modalResolve = resolve;
    $("#modalForm").onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      const error = validate?.(data);
      if (error) {
        $("#modalError").textContent = error;
        return;
      }
      appState.modalResolve = null;
      closeModal();
      resolve(data);
    };
  });
}
export async function confirmDelete(kind, id) {
  closeModal();
  const labels = {
    person: translate("ui.thePersonAndTheirRelationships"),
    relation: translate("ui.theRelationship"),
    document: translate("ui.theDocument"),
    property: translate("ui.theProperty"),
  };
  const f = await openDialog(
    `${translate("ui.delete")} ` + labels[kind] + "?",
    `<p class="hint">${translate("ui.youCanUndoThisOnTheMapWhen")}</p>`,
    {
      submit: translate("ui.delete"),
    },
  );
  if (!f) return;
  commit(() => {
    if (kind === "person") {
      appState.project.people = appState.project.people.filter(
        (p) => p.id !== id,
      );
      const rs = appState.project.relations
        .filter((r) => r.from === id || r.to === id)
        .map((r) => r.id);
      appState.project.relations = appState.project.relations.filter(
        (r) => !rs.includes(r.id),
      );
      appState.project.documents.forEach((d) => {
        d.people = d.people.filter((p) => p !== id);
        if (Array.isArray(d.subjectIds))
          d.subjectIds = d.subjectIds.filter((x) => x !== id);
        d.relations = d.relations.filter((r) => !rs.includes(r));
      });
      appState.project.property.forEach((a) => {
        if (a.ownerId === id) a.ownerId = "";
        a.allocations = a.allocations.filter((x) => x.personId !== id);
      });
      if (appState.project.subjectId === id) appState.project.subjectId = "";
      if (appState.project.claimantId === id) appState.project.claimantId = "";
    } else if (kind === "relation") {
      appState.project.relations = appState.project.relations.filter(
        (r) => r.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.relations = d.relations.filter((r) => r !== id)),
      );
    } else if (kind === "document") {
      appState.project.documents = appState.project.documents.filter(
        (d) => d.id !== id,
      );
      appState.project.people.forEach((p) => {
        for (const key of ["bioSourceIds", "healthSourceIds"])
          p[key] = (p[key] || []).filter((x) => x !== id);
        for (const cfg of Object.values(recordConfigs()))
          for (const r of p[cfg.key] || [])
            if (r.sourceId === id) r.sourceId = "";
      });
    } else {
      appState.project.property = appState.project.property.filter(
        (a) => a.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.propertyIds = (d.propertyIds || []).filter((x) => x !== id)),
      );
    }
    repairSelection();
  });
}
export function bindDialogEvents() {
  $("#modal").addEventListener("close", () => {
    if ($("#modal").open) return;
    if (appState.modalResolve) {
      const resolve = appState.modalResolve;
      appState.modalResolve = null;
      resolve(null);
    }
  });
  $("#modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });
}
