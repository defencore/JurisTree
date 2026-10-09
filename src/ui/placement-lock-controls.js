import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import {
  placementSelection,
  nodePlacementLocked,
  connectorPlacementLocked,
} from "../model/placement-locks.js";
import { icon } from "./icons.js";

export function placementLockControls() {
  const targets = placementSelection(
      state.project,
      state,
      filteredGraphNodes(),
    ),
    locks = state.project.placementLocks || { nodes: [], connectors: [] },
    explicit =
      targets.nodes.some((key) => locks.nodes.includes(key)) ||
      targets.connectors.some((key) => locks.connectors.includes(key)),
    canLock =
      targets.nodes.some((key) => !locks.nodes.includes(key)) ||
      targets.connectors.some((key) => !locks.connectors.includes(key)),
    movable =
      targets.nodes.some(
        (key) => !nodePlacementLocked(state.project, ...key.split(":")),
      ) ||
      targets.connectors.some(
        (key) => !connectorPlacementLocked(state.project, key),
      ),
    count = targets.nodes.length + targets.connectors.length;
  if (!count) return "";
  return `<div class="placement-lock-controls"><button class="btn small" data-action="lock-placement" ${!canLock || state.analysisBusy ? "disabled" : ""} title="${t("ui.lockPlacementHint")}">${icon("lock")}${t("ui.lockPlacement")}</button><button class="btn small" data-action="unlock-placement" ${!explicit || state.analysisBusy ? "disabled" : ""}>${icon("unlock")}${t("ui.unlockPlacement")}</button>${!movable && !explicit ? `<span class="hint">${t("ui.lockedByGroup")}</span>` : ""}</div>`;
}
