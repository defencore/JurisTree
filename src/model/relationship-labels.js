import { displayDate } from "./dates.js";
import { relTypes } from "../core/config.js";
import { isProfessionalRelationship } from "../core/professional-relationships.js";
import { relationshipConfig } from "../core/relationships.js";
import { translate } from "../i18n/index.js";
import { person } from "./lookup.js";

export function relationshipLabel(r) {
  if (!["spouse", "partner"].includes(r.type)) return relTypes()[r.type];
  if (r.status === "divorced") return translate("ui.divorced");
  const fields = relationshipConfig().fields;
  const kind = fields.find(([key]) => key === "unionKind")[3];
  const label =
    r.unionKind && r.unionKind !== "unspecified"
      ? kind[r.unionKind] || relTypes()[r.type]
      : relTypes()[r.type];
  const status = fields.find(([key]) => key === "status")[3];
  return ["ended", "separated", "widowed"].includes(r.status)
    ? `${label} · ${status[r.status]}`
    : label;
}

export function roleGroup(r, id) {
  if (isProfessionalRelationship(r.type)) return "professional";
  if (["parent", "adopted", "step_parent"].includes(r.type))
    return r.to === id ? "parents" : "children";
  return ["spouse", "partner"].includes(r.type) ? "partners" : "other";
}

export function roleLabel(r, id) {
  const other = person(r.from === id ? r.to : r.from),
    female = other?.gender === "f",
    male = other?.gender === "m";
  const group = roleGroup(r, id);
  if (r.type === "reports_to")
    return translate(
      id === r.from ? "ui.supervisorPerson" : "ui.subordinatePerson",
    );
  if (r.type === "spouse" && r.status === "divorced")
    return translate(
      female ? "ui.formerWife" : male ? "ui.formerHusband" : "ui.formerSpouse",
    );
  if (
    ["spouse", "partner"].includes(r.type) &&
    r.unionKind &&
    r.unionKind !== "unspecified"
  )
    return relationshipLabel(r);
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

export function relationshipPeriod(relationship) {
  return [
    relationship.fromDate
      ? `${translate("ui.from")} ${displayDate(relationship.fromDate)}`
      : "",
    relationship.toDate
      ? `${translate("ui.to")} ${displayDate(relationship.toDate)}`
      : "",
  ]
    .filter(Boolean)
    .join(" — ");
}
