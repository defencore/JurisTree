import { relationshipConfig } from "../core/relationships.js";
import { relTypes } from "../core/config.js";
import { person } from "./project.js";
import { translate } from "../i18n/index.js";
export function roleGroup(r, id) {
  if (["parent", "adopted", "step_parent"].includes(r.type))
    return r.to === id ? "parents" : "children";
  return ["spouse", "partner"].includes(r.type) ? "partners" : "other";
}

export function roleLabel(r, id) {
  const other = person(r.from === id ? r.to : r.from),
    female = other?.gender === "f",
    male = other?.gender === "m";
  const group = roleGroup(r, id);
  if (
    ["spouse", "partner"].includes(r.type) &&
    r.unionKind &&
    r.unionKind !== "unspecified"
  )
    return (
      relationshipConfig().fields.find((f) => f[0] === "unionKind")[3][
        r.unionKind
      ] || relTypes()[r.type]
    );
  if (r.type === "step_parent")
    return translate(group === "parents" ? "ui.stepParent" : "ui.stepChild");
  if (r.type === "adopted")
    return group === "parents"
      ? translate("ui.adoptiveParent")
      : translate("ui.adoptedChild");
  if (group === "parents")
    return female
      ? translate("ui.mother")
      : male
        ? translate("ui.father")
        : translate("ui.parent");
  if (group === "children")
    return female
      ? translate("ui.daughter")
      : male
        ? translate("ui.son")
        : translate("ui.child");
  if (group === "partners")
    return female
      ? translate("ui.partner")
      : male
        ? translate("ui.partner2")
        : translate("ui.partner3");
  return r.type === "sibling"
    ? female
      ? translate("ui.sister")
      : male
        ? translate("ui.brother")
        : translate("ui.sibling")
    : relTypes()[r.type];
}
