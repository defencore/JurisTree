import { relTypes } from "../core/config.js";
import {
  duplicateRelationship,
  relationshipConfig,
} from "../core/relationships.js";
import { translate } from "../i18n/index.js";
import { profileRecordError } from "./profile-records.js";

export function selectedPeople(people, selection) {
  const ids = new Set(people.map((p) => p.id));
  return [...new Set(selection)].filter((id) => ids.has(id));
}

export function relationshipDefaults(
  people,
  selection,
  selected,
  context = {},
) {
  const pair = selectedPeople(people, selection);
  const explicit = context.from || context.to;
  const from =
    context.from ||
    (!explicit && pair.length === 2 ? pair[0] : "") ||
    (selected?.kind === "person" ? selected.id : "") ||
    people[0]?.id ||
    "";
  return {
    from,
    to:
      context.to ||
      (!explicit && pair.length === 2 ? pair[1] : "") ||
      people.find((p) => p.id !== from)?.id ||
      "",
    type: context.type || "parent",
    notes: "",
    disputed: false,
  };
}

function parentCycle(relations, from, to, except) {
  const stack = [to],
    seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (id === from) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const r of relations)
      if (
        (except == null || r.id !== except) &&
        ["parent", "adopted", "step_parent"].includes(r.type) &&
        r.from === id
      )
        stack.push(r.to);
  }
  return false;
}

/** Validate normal relationship edits and atomic batches using the same rules. */
export function relationshipDraftError(candidate, relations, people, except) {
  if (
    !people.has(candidate.from) ||
    !people.has(candidate.to) ||
    candidate.from === candidate.to
  )
    return translate("ui.selectTwoDifferentPeople");
  if (!Object.hasOwn(relTypes(), candidate.type))
    return translate("ui.invalidQuickRelationship");
  if (
    ["parent", "adopted", "step_parent"].includes(candidate.type) &&
    parentCycle(relations, candidate.from, candidate.to, except)
  )
    return translate("ui.thisWouldCreateAGenerationCycleCheckThe");
  const error = profileRecordError(relationshipConfig(), candidate);
  if (error) return error;
  return duplicateRelationship(relations, candidate, except)
    ? translate("ui.thisRelationshipAlreadyExists")
    : "";
}
