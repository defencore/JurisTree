import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { personBiography } from "../model/biography.js";
import { renderBiography } from "../ui/biography.js";

/** Prepare a standalone report from the same complete profile used by the on-screen biography. */
export function prepareBiographyPrint(id) {
  const biography = personBiography(appState.project, id);
  if (!biography) return false;
  const target = $("#biographyPrint");
  target.innerHTML =
    `<p class="print-report-title">${translate("ui.profileReport")}</p>` +
    renderBiography(biography);
  target
    .querySelectorAll(
      ".biography-toolbar,.biography-record-actions,[data-biography]",
    )
    .forEach((el) => el.remove());
  target.querySelectorAll("button[data-document]").forEach((button) => {
    const text = document.createElement("span");
    text.className = "print-source";
    text.textContent = button.textContent;
    button.replaceWith(text);
  });
  target.querySelectorAll("button").forEach((button) => button.remove());
  return true;
}
export async function printBiography(id) {
  if (!prepareBiographyPrint(id)) return;
  await Promise.all(
    [...$("#biographyPrint").querySelectorAll("img")].map((img) =>
      img.decode().catch(() => {}),
    ),
  );
  const title = document.title;
  document.title =
    appState.project.people.find((p) => p.id === id).name + " — JurisTree";
  window.addEventListener(
    "afterprint",
    () => {
      document.title = title;
      $("#biographyPrint").replaceChildren();
    },
    { once: true },
  );
  window.print();
}
