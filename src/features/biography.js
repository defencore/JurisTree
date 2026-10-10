import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { personBiography } from "../model/biography.js";
import { openDialog } from "../ui/dialog.js";
import { renderBiography } from "../ui/biography.js";

export function viewBiography(id) {
  const biography = personBiography(appState.project, id);
  if (!biography) return;
  return openDialog(translate("ui.autobiography"), renderBiography(biography), {
    wide: true,
    footer: false,
    kind: "biography",
    onOpen: () => {
      document.querySelector("#modal").dataset.biographyPerson = id;
    },
  });
}
