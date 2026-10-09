import { types } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { translate } from "../../i18n/index.js";
import { icon } from "../icons.js";

export function renderPersonChecklist(req) {
  return `<details class="profile-editor-section" data-profile-panel="requirements"><summary>${icon("clipboard")}${translate("ui.requiredDocuments")}<span>${req.length}</span>${icon("chevron")}</summary><div><div class="check-grid">${Object.entries(
    types(),
  )
    .filter(
      ([t]) =>
        ![
          "photo",
          "letter",
          "testimony",
          "rumor",
          "recording",
          "other",
        ].includes(t),
    )
    .map(
      ([t, l]) =>
        `<label><input type="checkbox" name="requirements" value="${t}" ${req.includes(t) ? "checked" : ""}>${esc(l)}</label>`,
    )
    .join("")}</div></div></details>`;
}
