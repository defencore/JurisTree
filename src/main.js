import { applyTheme } from "./core/theme.js";
import { bindFloatingWindows } from "./ui/floating-windows.js";
import { startTemplates } from "./core/config.js";
import { init } from "./app/bootstrap.js";
import { bindEvents } from "./app/events.js";
import { bindGraphInteractions } from "./graph/interaction.js";
import { mountShell, localizeShell } from "./ui/shell.js";
import { getLanguage, setLanguage } from "./i18n/index.js";
import { render } from "./ui/render.js";
import { renderStart } from "./features/launcher.js";
import { saveNow } from "./services/storage.js";
import { state as appState } from "./core/state.js";
applyTheme();
mountShell();
setLanguage(getLanguage());
localizeShell();
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
