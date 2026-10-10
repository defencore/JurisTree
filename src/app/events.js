import { bindMapPanelEvents } from "../ui/map-panels.js";
import { bindDateInputEvents } from "../ui/date-input.js";
import { bindSearchEvents } from "../features/search.js";
import { bindKeyboardEvents } from "./events/keyboard.js";
import { bindUploadsEvents } from "./events/uploads.js";
import { bindDialogEvents } from "../ui/dialog.js";
import { bindClickEvents } from "./events/click.js";
import { bindChangeEvents } from "./events/change.js";
import { bindInputEvents } from "./events/input.js";
import { bindResizeEvents } from "../graph/interaction.js";
import { bindLauncherEvents } from "../features/launcher.js";
import { bindClipboardEvents } from "./events/clipboard.js";
export function bindEvents() {
  bindMapPanelEvents();
  bindDateInputEvents();
  bindClipboardEvents();
  bindUploadsEvents();
  bindDialogEvents();
  bindClickEvents();
  bindChangeEvents();
  bindInputEvents();
  bindResizeEvents();
  bindLauncherEvents();
  bindSearchEvents();
  bindKeyboardEvents();
}
