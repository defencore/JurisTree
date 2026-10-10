import { ancestorPaths, familyPath } from "./kinship-paths.js";
import {
  genderWord,
  relationFromDistances,
  affinityLabel,
} from "./kinship-labels.js";
import { relTypes } from "../core/config.js";
import { familyConnection } from "../core/relationships.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { edgeState } from "./evidence.js";
import { withKinshipIndex } from "./kinship-index.js";
import { person, relation } from "./lookup.js";

export function kinshipBetween(from, to, affinity = true) {
  return withKinshipIndex((index) => kinshipResult(from, to, affinity, index));
}
function kinshipResult(from, to, affinity, index) {
  const a = person(from),
    b = person(to);
  if (!a || !b)
    return {
      found: false,
      label: translate("ui.selectTwoPeople"),
    };
  if (from === to)
    return {
      found: true,
      kind: "self",
      label: translate("ui.thisIsTheSamePerson"),
      people: [from],
      relations: [],
      verified: true,
    };
  const pa = ancestorPaths(from),
    pb = ancestorPaths(to);
  const candidates = [];
  for (const [id, pathA] of pa)
    if (pb.has(id))
      candidates.push({
        id,
        a: pathA,
        b: pb.get(id),
      });
  for (const r of index.siblings) {
    for (const [x, y] of [
      [r.from, r.to],
      [r.to, r.from],
    ])
      if (pa.has(x) && pb.has(y)) {
        const xa = pa.get(x),
          yb = pb.get(y);
        candidates.push({
          id: null,
          virtual: true,
          a: {
            ...xa,
            distance: xa.distance + 1,
          },
          b: {
            ...yb,
            distance: yb.distance + 1,
          },
          extra: [r.id],
        });
      }
  }
  candidates.sort(
    (x, y) =>
      (x.a.distance === 0 || x.b.distance === 0
        ? -1000
        : Math.max(x.a.distance, x.b.distance)) -
        (y.a.distance === 0 || y.b.distance === 0
          ? -1000
          : Math.max(y.a.distance, y.b.distance)) ||
      x.a.distance + x.b.distance - (y.a.distance + y.b.distance),
  );
  if (candidates.length) {
    const c = candidates[0],
      label = relationFromDistances(c.a.distance, c.b.distance, b),
      relations = [
        ...new Set([...c.a.relations, ...c.b.relations, ...(c.extra || [])]),
      ],
      people = [...new Set([...c.a.people, ...c.b.people])];
    if (
      label.kind === "sibling" &&
      !relations.some((id) => relation(id)?.type === "adopted")
    ) {
      const parents = (id) =>
        new Set(
          (index.parents.get(id) || [])
            .filter((r) => r.type === "parent")
            .map((r) => r.from),
        );
      const first = parents(from),
        second = parents(to);
      if (
        first.size >= 2 &&
        second.size >= 2 &&
        [...first].filter((id) => second.has(id)).length === 1
      ) {
        label.kind = "half_sibling";
        label.label = genderWord(
          b,
          translate("ui.halfSister"),
          translate("ui.halfBrother"),
          translate("ui.halfSibling"),
        );
      }
    }
    return {
      found: true,
      ...label,
      from,
      to,
      ancestorId: c.id,
      virtualAncestor: !!c.virtual,
      distanceFrom: c.a.distance,
      distanceTo: c.b.distance,
      pathFrom: c.a,
      pathTo: c.b,
      people,
      relations,
      adopted: relations.some((id) => relation(id)?.type === "adopted"),
      disputed: relations.some((id) => relation(id)?.disputed),
      verified: relations.every((id) => edgeState(relation(id)) === "official"),
    };
  }
  const spouse = (index.family.get(from) || []).find(
    (r) =>
      r.type === "spouse" &&
      ((r.from === from && r.to === to) || (r.from === to && r.to === from)),
  );
  if (spouse)
    return {
      found: true,
      kind: "partner",
      label: genderWord(
        b,
        translate("ui.wifePartner"),
        translate("ui.husbandPartner"),
        translate("ui.partner3"),
      ),
      people: [from, to],
      relations: [spouse.id],
      verified: edgeState(spouse) === "official",
    };
  if (affinity) {
    const path = familyPath(from, to);
    if (path?.steps.includes("partner")) {
      const description = affinityLabel(path, b);
      return {
        found: true,
        kind: "affinity",
        ...description,
        from,
        to,
        people: path.people,
        relations: path.relations,
        pathVia: path,
        adopted: path.relations.some((id) => relation(id)?.type === "adopted"),
        disputed: path.relations.some((id) => relation(id)?.disputed),
        verified: path.relations.every(
          (id) => edgeState(relation(id)) === "official",
        ),
      };
    }
    for (const r of (index.family.get(from) || []).filter(
      (r) => r.type === "spouse" && (r.from === from || r.to === from),
    )) {
      const partner = r.from === from ? r.to : r.from,
        k = kinshipBetween(partner, to, false);
      if (k.found)
        return {
          ...k,
          kind: "affinity",
          label: translate("ui.yourPartnerSRelative"),
          detail: person(partner).name + ": " + k.label,
          people: [...new Set([from, ...k.people])],
          relations: [r.id, ...k.relations],
          verified: false,
        };
    }
    for (const r of (index.family.get(to) || []).filter(
      (r) => r.type === "spouse" && (r.from === to || r.to === to),
    )) {
      const partner = r.from === to ? r.to : r.from,
        k = kinshipBetween(from, partner, false);
      if (k.found)
        return {
          ...k,
          kind: "affinity",
          label: translate("ui.yourRelativeSPartner"),
          detail: person(partner).name + ": " + k.label,
          people: [...new Set([...k.people, to])],
          relations: [...k.relations, r.id],
          verified: false,
        };
    }
  }
  const other = appState.project.relations.find(
    (r) =>
      ((r.from === from && r.to === to) || (r.from === to && r.to === from)) &&
      !familyConnection(r),
  );
  return other
    ? {
        found: false,
        kind: other.type,
        label:
          other.type === "acquaintance"
            ? translate("ui.acquaintanceKinshipNotEstablished")
            : ["ended", "divorced"].includes(other.status)
              ? translate("ui.endedRelationship")
              : other.type === "step_parent"
                ? translate(
                    other.from === from ? "ui.stepChild" : "ui.stepParent",
                  )
                : other.type === "partner"
                  ? relTypes().partner
                  : translate("ui.possibleRelationshipKinshipNotConfirmed"),
        people: [from, to],
        relations: [other.id],
      }
    : {
        found: false,
        label: translate("ui.noFamilyPathFoundYet"),
        detail: translate("ui.thisDoesNotProveThereIsNoKinship"),
      };
}
