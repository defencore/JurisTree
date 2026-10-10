import { relTypes } from "../../core/config.js";
import {
  isProfessionalRelationship,
  professionalFieldKeys,
} from "../../core/professional-relationships.js";
import {
  relationshipConfig,
  relationshipFields,
} from "../../core/relationships.js";
import { translate } from "../../i18n/index.js";
import { profileRecordError } from "../profile-records.js";
import { str } from "./schema.js";

export function normalizeImportedRelationship(r, peopleIds) {
  if (
    !peopleIds.has(r.from) ||
    !peopleIds.has(r.to) ||
    r.from === r.to ||
    !relTypes()[r.type]
  )
    throw Error(translate("ui.invalidRelationship"));
  const details = {};
  const cfg = relationshipConfig();
  for (const [key, , type, options] of cfg.fields) {
    let value = str(r[key], type === "textarea" ? 5000 : 1500);
    if (type === "select" && !Object.hasOwn(options, value))
      value = Object.keys(options)[0];
    details[key] = value;
  }
  const typeFields = relationshipFields(r.type).groups.flatMap((g) => g.fields);
  const unionOptions = typeFields.find((f) => f[0] === "unionKind")?.[3];
  if (details.unionKind !== "unspecified" && !unionOptions?.[details.unionKind])
    throw Error(translate("ui.invalidRelationship"));
  if (
    isProfessionalRelationship(r.type) &&
    !Object.hasOwn(typeFields.find((f) => f[0] === "status")[3], details.status)
  )
    throw Error(translate("ui.invalidRelationship"));
  if (
    !isProfessionalRelationship(r.type) &&
    [...professionalFieldKeys].some(
      (key) => details[key] && details[key] !== "unspecified",
    )
  )
    throw Error(translate("ui.invalidRelationship"));
  const error = profileRecordError(cfg, details);
  if (error) throw Error(error);
  return {
    id: r.id,
    from: r.from,
    to: r.to,
    type: r.type,
    notes: str(r.notes),
    disputed: !!r.disputed,
    ...details,
  };
}
