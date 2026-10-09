import { newPersonRoles } from "../core/person-creation.js";
import { collectRelationship } from "../core/relationships.js";
import { translate } from "../i18n/index.js";
import {
  relationshipDraftError,
  selectedPeople,
} from "./relationship-draft.js";

export function creationLinkTargets(people, selection, selected) {
  const ids = selectedPeople(people, selection);
  if (ids.length > 0 && ids.length <= 2) return ids;
  return selected?.kind === "person" && people.some((p) => p.id === selected.id)
    ? [selected.id]
    : [];
}

export function collectCreationLinks(form, personId) {
  if (!form.has("create-relationships")) return [];
  const targets = form.getAll("new-link-person"),
    roles = form.getAll("new-link-role");
  return targets.map((target, i) => {
    const role = newPersonRoles[roles[i]];
    if (!role) return { from: personId, to: target, type: "" };
    const details = new FormData();
    details.set("type", role.type);
    for (const key of ["fromDate", "toDate", "verification"])
      details.set(
        "relationship-" + key,
        form.getAll("new-link-" + key)[i] || "",
      );
    if (role.unionKind) details.set("relationship-unionKind", role.unionKind);
    return {
      ...collectRelationship(details),
      from: role.incoming ? target : personId,
      to: role.incoming ? personId : target,
      type: role.type,
      notes: String(form.getAll("new-link-notes")[i] || "").trim(),
      disputed: false,
    };
  });
}

export function creationLinksError(form, personId, project) {
  const links = collectCreationLinks(form, personId);
  if (form.has("create-relationships") && !links.length)
    return translate("ui.invalidQuickRelationship");
  const people = new Set([...project.people.map((p) => p.id), personId]);
  const relations = [...project.relations];
  for (const link of links) {
    const error = relationshipDraftError(link, relations, people);
    if (error) return error;
    relations.push(link);
  }
  return "";
}
