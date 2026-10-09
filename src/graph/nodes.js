import { docStates } from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { theme } from "../core/theme.js";
import { getLocale, translate } from "../i18n/index.js";
import { personDisplayName, personLifeDates } from "../model/person-display.js";
import { hasFile, requirements } from "../model/evidence.js";
import { directConnectionScope, fullDiagram } from "../model/graph-view.js";
import { person } from "../model/lookup.js";
import { documentIcon } from "../ui/components.js";
import { svgIcon } from "../ui/icons.js";
import { personStatusBadges } from "../ui/person-status.js";
import { personCard, personCardActions } from "./cards/person.js";
import { graphRole } from "./roles.js";
import { svgText } from "./text.js";

export function nodeSVG(n, images = null, exporting = false) {
  const multi =
      !exporting &&
      ((appState.diagramEditing &&
        appState.diagramNodeSelection.has(n.kind + ":" + n.id)) ||
        appState.multiSelection.has(n.id) ||
        (n.kind === "group" &&
          n.members.some((id) => appState.multiSelection.has(id)))),
    direct = !fullDiagram() && directConnectionScope(),
    focus =
      !fullDiagram() &&
      (direct
        ? n.kind === "group"
          ? n.members.some((id) => direct.people.has(id))
          : n.kind === "person" && direct.people.has(n.id)
        : appState.analysisHighlight?.people.includes(n.id)),
    dim =
      !fullDiagram() &&
      (direct
        ? !focus
        : appState.analysisHighlight &&
          n.kind === "person" &&
          !focus &&
          !(
            appState.selected?.kind === "person" &&
            appState.selected.id === n.id
          ) &&
          !multi),
    active =
      !exporting &&
      appState.selected?.kind === n.kind &&
      appState.selected.id === n.id,
    role = n.kind === "person" && !exporting ? graphRole(n.id) : null;
  const family = appState.project.groups.find((g) =>
    (n.groupIds || []).includes(g.id),
  );
  let inside = "",
    stroke = active || multi || focus ? "#081f3c" : role?.color || "#d5deea";
  if (n.kind === "person") {
    inside = personCard(n, images, role);
    if (!role && family && !active && !multi && !focus) stroke = family.color;
  } else if (n.kind === "document") {
    const s = docStates()[n.status] || docStates().needs_review,
      c =
        s.tone === "available"
          ? "#28644a"
          : s.tone === "review"
            ? "#6c538f"
            : s.tone === "requested"
              ? "#3e516c"
              : "#8d6b2c";
    inside = `<rect x="15" y="17" width="34" height="40" rx="8" fill="#e7eef6"/>${svgIcon(documentIcon(n), 21, 24, "#3e516c", 0.75)}${svgText(n.title, 59, 32, 22, 2, 14, "#081f3c", 700, n.w - 72)}<path d="M15 80H${n.w - 15}" stroke="#e7eef6"/>${svgIcon(s.icon, 15, 93, c, 0.65)}${svgText(s.label, 37, 106, 23, 1, 14, c, 400, n.w - 50)}${svgText(hasFile(n) ? translate("ui.fileAttached2") : translate("ui.noDigitalCopy2"), 15, 70, 35, 1, 12.5, "#3e516c", 400)}`;
  } else if (n.kind === "group") {
    inside = `<rect x="16" y="17" width="43" height="43" rx="12" fill="${n.color}" fill-opacity=".1"/>${svgIcon("users", 26, 27, n.color, 0.9)}${svgText(n.name, 73, 38, 20, 2, 16, "#081f3c", 700, n.w - 85)}${svgText(
      n.members.length +
        ` ${translate("ui.peopleGaps")} ` +
        n.members
          .map(person)
          .flatMap(requirements)
          .filter((r) => !r.done).length,
      16,
      89,
      34,
      1,
      12.5,
      n.color,
      550,
    )}${svgText(translate("ui.clickToExpand"), 16, 111, 34, 1, 12.5, "#3e516c", 400)}`;
    if (!multi && !focus && !active) stroke = n.color;
  } else {
    inside = `<rect x="16" y="17" width="38" height="42" rx="10" fill="#edf6f0"/>${svgIcon("home", 24, 27, "#28644a", 0.9)}${svgText(n.title, 66, 35, 22, 2, 15)}${svgText(n.value ? new Intl.NumberFormat(getLocale()).format(Number(n.value)) + " " + n.currency : translate("ui.valueNotSpecified"), 16, 94, 31, 1, 13, "#3e516c", 400)}`;
  }
  const actions =
    n.kind === "person" && !exporting ? personCardActions(n, dim) : "";
  const label =
    n.kind === "person"
      ? [
          personDisplayName(n),
          role?.description || role?.label,
          personLifeDates(n),
          ...personStatusBadges(n).map((b) => b.label),
        ]
          .filter(Boolean)
          .join(" · ")
      : n.name || n.title;
  return `<g class="node${multi ? " multi" : ""}" opacity="${dim ? 0.3 : 1}" data-node="${n.id}" data-kind="${n.kind}" ${role ? `data-kinship-role="${role.kind}" data-kinship-group="${role.group}"` : ""} transform="translate(${n.x} ${n.y})" tabindex="0" role="button" aria-label="${esc(label)}"><rect class="card" width="${n.w}" height="${n.h}" rx="6" fill="${role?.bg || theme.paper}" stroke="${stroke}" stroke-opacity="${active || multi || focus || role ? 1 : 0.6}" stroke-width="${active || multi || focus ? 2.3 : role ? 1.7 : 1}" />${inside}</g>${actions}`;
}
