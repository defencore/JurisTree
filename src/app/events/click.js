import { state } from "../../core/state.js";
import { toggleGraphSelection } from "../../features/graph-analysis.js";
import { translate } from "../../i18n/index.js";
import { toast } from "../../ui/dialog.js";
import { profilesClicks } from "./click/profiles.js";
import { propertyClicks } from "./click/property.js";
import { calendarClicks } from "./click/calendar.js";
import { graphClicks } from "./click/graph.js";
import { sourcesClicks } from "./click/sources.js";
import { navigationClicks } from "./click/navigation.js";

// Preserve precedence when a control carries both a contextual and a generic action.
const handlers = [
  ...profilesClicks,
  ...propertyClicks,
  ...calendarClicks,
  ...graphClicks,
  ...sourcesClicks,
  ...navigationClicks,
].sort((a, b) => a.priority - b.priority);
const targets =
  "button,#dropZone,[data-favorite],[data-person],[data-biography],[data-document],[data-relation],[data-edge],[data-gap-kind],[data-required],[data-toggle-group]";

export function bindClickEvents() {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("[data-person]");
    if (
      !target ||
      event.button !== 0 ||
      event.pointerType === "touch" ||
      state.view !== "tree" ||
      !(event.ctrlKey || event.metaKey || event.shiftKey)
    )
      return;
    event.preventDefault();
    toggleGraphSelection(target.dataset.person);
  });
  document.addEventListener("click", async (event) => {
    const target = event.target.closest(targets);
    if (!target) return;
    const handler = handlers.find((handler) => handler.matches(target));
    if (!handler) return;
    try {
      await handler.run(target, event);
    } catch (error) {
      toast(error.message || translate("ui.couldNotCompleteTheAction"), true);
    }
  });
}
