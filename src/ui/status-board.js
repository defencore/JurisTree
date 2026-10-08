import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { sourceInScope, hasFile, gaps } from "../model/evidence.js";
import { translate } from "../i18n/index.js";
import { icon } from "./icons.js";
export function renderStatusBoard() {
  const ds = appState.project.documents.filter(sourceInScope),
    present = ds.filter((d) => d.status === "available").length,
    review = ds.filter(
      (d) =>
        d.status === "needs_review" ||
        (d.status === "available" && d.evidence === "unverified"),
    ).length,
    files = ds.filter(hasFile).length;
  $("#statusBoard").innerHTML = [
    [
      "available",
      present,
      translate("ui.documentsAvailable2"),
      "fileCheck",
      "available",
    ],
    [
      "missing",
      gaps().length,
      translate("ui.evidenceMissing2"),
      "fileMissing",
      "gaps",
    ],
    ["review", review, translate("ui.review2"), "search", "review"],
    [
      "neutral",
      files + "/" + ds.length,
      translate("ui.filesAttached"),
      "paperclip",
      "files",
    ],
  ]
    .map(
      ([tone, count, label, ic, filter]) =>
        `<button class="status-tile" data-overview="${filter}"><span class="tile-icon tone-${tone}">${icon(ic)}</span><span><b>${count}</b><small>${label}</small></span></button>`,
    )
    .join("");
}
