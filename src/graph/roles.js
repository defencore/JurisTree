import { familyConnection } from "../core/relationships.js";
import { state } from "../core/state.js";
import { theme } from "../core/theme.js";
import { getLanguage, translate as t } from "../i18n/index.js";
import { genderWord, kinshipBetween } from "../model/kinship.js";
import { person, relation } from "../model/lookup.js";
import { roleGroup, roleLabel } from "../model/relationship-labels.js";

export const graphRoleGroups = {
  self: {
    label: "ui.selectedPerson",
    color: theme.ink,
    bg: theme["blue-soft"],
  },
  ancestors: {
    label: "ui.graphAncestorRoles",
    color: theme["blue-dark"],
    bg: theme["blue-soft"],
  },
  descendants: {
    label: "ui.graphDescendantRoles",
    color: theme.teal,
    bg: theme["green-soft"],
  },
  partners: {
    label: "ui.partners",
    color: theme.accent,
    bg: theme["amber-soft"],
  },
  siblings: {
    label: "ui.graphSiblingRoles",
    color: theme.violet,
    bg: theme["violet-soft"],
  },
  collateral: {
    label: "ui.graphCollateralRoles",
    color: theme.red,
    bg: theme["red-soft"],
  },
  affinity: {
    label: "ui.graphAffinityRoles",
    color: theme.muted,
    bg: theme["accent-soft"],
  },
};
const categories = {
  self: "self",
  parent: "ancestors",
  ancestor: "ancestors",
  child: "descendants",
  descendant: "descendants",
  partner: "partners",
  sibling: "siblings",
  half_sibling: "siblings",
  aunt: "collateral",
  nephew: "collateral",
  cousin: "collateral",
  affinity: "affinity",
  step_parent: "affinity",
  step_child: "affinity",
};
let cache;

function resolveRole(from, to) {
  if (from === to) return { kind: "self", label: t("ui.selectedPerson") };
  const target = person(to);
  if (!target) return null;
  const links = state.project.relations.filter(
    (r) => (r.from === from && r.to === to) || (r.to === from && r.from === to),
  );
  const family = links.filter(familyConnection);
  let direct =
    family.find((r) => r.type === "parent") ||
    family.find((r) => r.type === "adopted");
  let kind, label;
  if (direct) {
    kind = roleGroup(direct, from) === "parents" ? "parent" : "child";
    label = roleLabel(direct, from);
  } else {
    direct = family.find((r) => r.type === "spouse");
    if (direct) {
      kind = "partner";
      label =
        direct.unionKind === "civil"
          ? genderWord(
              target,
              t("ui.partner"),
              t("ui.partner2"),
              t("ui.partner3"),
            )
          : genderWord(
              target,
              t("ui.wife"),
              t("ui.husband"),
              t("ui.spouseRole"),
            );
    } else {
      direct = links.find(
        (r) =>
          ["step_parent", "partner"].includes(r.type) &&
          !["unverified", "refuted"].includes(r.verification) &&
          !["ended", "divorced"].includes(r.status),
      );
      if (direct) {
        kind =
          direct.type === "partner"
            ? "partner"
            : direct.to === from
              ? "step_parent"
              : "step_child";
        label = roleLabel(direct, from);
      }
    }
  }
  const k = direct ? null : kinshipBetween(from, to);
  if (!direct && !k.found) return null;
  kind ||=
    k.kind === "ancestor" && k.distanceFrom === 1
      ? "parent"
      : k.kind === "descendant" && k.distanceTo === 1
        ? "child"
        : k.kind;
  label ||= k.label;
  const adopted = direct ? direct.type === "adopted" : !!k.adopted;
  const disputed = direct
    ? direct.disputed || direct.verification === "disputed"
    : k.relations.some(
        (id) =>
          relation(id)?.disputed || relation(id)?.verification === "disputed",
      );
  return {
    kind,
    label,
    adopted,
    disputed,
    description: [
      label,
      k?.detail,
      adopted && t("ui.pathIncludesAdoption"),
      disputed && t("ui.pathIncludesDisputedRelationships"),
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/** Cache the selected person's roles across camera, layout and filter redraws. */
export function graphRole(id) {
  const selected = state.selected;
  if (selected?.kind !== "person" || !person(selected.id)) return null;
  const key = [state.project.updatedAt, selected.id, getLanguage()].join("|");
  if (!cache || cache.project !== state.project || cache.key !== key)
    cache = { project: state.project, key, roles: new Map() };
  if (!cache.roles.has(id)) {
    const role = resolveRole(selected.id, id);
    const group = role && categories[role.kind];
    cache.roles.set(
      id,
      role && group
        ? {
            ...role,
            group,
            color: graphRoleGroups[group].color,
            bg: graphRoleGroups[group].bg,
          }
        : null,
    );
  }
  return cache.roles.get(id);
}
