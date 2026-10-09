import { onSignal } from "../core/signals.js";
import { scheduleSave } from "../services/storage.js";
import { toast } from "../ui/dialog.js";
import { render } from "../ui/render.js";
import { updateSaveStatus } from "../ui/save-status.js";

export function bindRuntime() {
  onSignal("project:changed", () => {
    render();
    scheduleSave();
  });
  onSignal("storage:status", updateSaveStatus);
  onSignal("storage:error", (message) => toast(message, true));
}
