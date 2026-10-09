import { $ } from "../core/dom.js";
import { download } from "../core/utils.js";
import { guideExampleProject } from "../data/guide-example.js";
import { translate } from "../i18n/index.js";
import { openDialog } from "../ui/dialog.js";
import { bindUserGuide, renderUserGuide } from "../ui/user-guide.js";

export function openUserGuide() {
  openDialog(translate("ui.userGuideTitle"), renderUserGuide(), {
    wide: true,
    footer: false,
    kind: "guide",
    onOpen: () => bindUserGuide($("[data-user-guide]")),
  });
}
export function downloadGuideExample() {
  download(
    new Blob([JSON.stringify(guideExampleProject(), null, 2)], {
      type: "application/json",
    }),
    "juristree-guide-example.json",
  );
}
