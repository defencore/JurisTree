import { startTemplates } from "./core/workspace-modes.js";
import { init } from "./app/bootstrap.js";
import { bindEvents } from "./app/events.js";
import { bindRuntime } from "./app/runtime.js";
import { state as appState } from "./core/state.js";
import { applyTheme } from "./core/theme.js";
import { bindGraphInteractions } from "./graph/interaction.js";
import { getLanguage, setLanguage } from "./i18n/index.js";
import { saveNow } from "./services/storage.js";
import { bindFloatingWindows } from "./ui/floating-windows.js";
import { render } from "./ui/render.js";
import { localizeShell, mountShell } from "./ui/shell.js";
import { renderStart } from "./ui/start.js";

applyTheme();
mountShell();
setLanguage(getLanguage());
localizeShell();
bindRuntime();
bindEvents();
bindFloatingWindows();
bindGraphInteractions();
document.addEventListener("change", (event) => {
  if (!event.target.matches("[data-language]")) return;
  const title = document.querySelector("#startTitle");
  const defaultTitle =
    title.value === startTemplates()[appState.startTemplate].name;
  setLanguage(event.target.value);
  localizeShell();
  if (defaultTitle) title.value = startTemplates()[appState.startTemplate].name;
  renderStart();
  if (appState.editorActive) render();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && appState.editorActive)
    void saveNow();
});
await init();
