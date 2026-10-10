import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { personBiography } from "../model/biography.js";
import { personDisplayName } from "../model/person-display.js";
import { biographyReport } from "../ui/biography-report.js";

/** Prepare a standalone report from the same complete profile used by the on-screen biography. */
export function prepareBiographyPrint(id, options = {}) {
  const biography = personBiography(appState.project, id);
  if (!biography) return false;
  const target = $("#biographyPrint");
  target.innerHTML =
    `<p class="print-report-title">${translate("ui.profileReport")}</p>` +
    biographyReport(biography, options);
  return true;
}
export async function printBiography(id, options = {}) {
  if (!prepareBiographyPrint(id, options)) return;
  await Promise.all(
    [...$("#biographyPrint").querySelectorAll("img")].map((img) =>
      img.decode().catch(() => {}),
    ),
  );
  const title = document.title;
  document.title =
    personDisplayName(appState.project.people.find((p) => p.id === id)) +
    " — JurisTree";
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
