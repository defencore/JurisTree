import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { resetWindow } from "./floating-windows.js";
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
    onOpen = null,
    kind = "",
  } = {},
) {
  if ($("#modal").open) closeModal();
  resetWindow($("#modal"));
  $("#modal").classList.toggle("wide", wide);
  $("#modal").dataset.kind = kind;
  $("#modalTitle").textContent = title;
  $("#modalContent").innerHTML = html;
  $("#modalError").textContent = "";
  $("#modalFooter").innerHTML = footer
    ? `<button type="button" class="btn" data-close>${translate("ui.cancel")}</button><button class="btn primary" type="submit">${esc(submit)}</button>`
    : `<button type="button" class="btn" data-close>${translate("ui.close")}</button>`;
  $("#modal").showModal();
  $("#modal .modal-body").scrollTop = 0;
  icons();
  onOpen?.();
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
