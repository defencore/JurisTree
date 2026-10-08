import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { edgeState } from "./evidence.js";
import { person, relation } from "./project.js";
export function ancestorPaths(id) {
  const paths = new Map([
      [
        id,
        {
          id,
          distance: 0,
          people: [id],
          relations: [],
        },
      ],
    ]),
    queue = [paths.get(id)];
  while (queue.length) {
    const current = queue.shift();
    for (const r of appState.project.relations) {
      if (!["parent", "adopted"].includes(r.type) || r.to !== current.id)
        continue;
      const next = {
        id: r.from,
        distance: current.distance + 1,
        people: [...current.people, r.from],
        relations: [...current.relations, r.id],
      };
      if (!paths.has(next.id) || paths.get(next.id).distance > next.distance) {
        paths.set(next.id, next);
        queue.push(next);
      }
    }
  }
  return paths;
}
export function genderWord(p, f, m, u) {
  return p?.gender === "f" ? f : p?.gender === "m" ? m : u;
}
export function linealLabel(p, distance, ancestor) {
  if (distance === 1)
    return genderWord(
      p,
      ancestor ? translate("ui.mother") : translate("ui.daughter"),
      ancestor ? translate("ui.father") : translate("ui.son"),
      ancestor ? translate("ui.parent") : translate("ui.child"),
    );
  if (distance <= 5) {
    const prefix = translate("ui.great").repeat(distance - 2),
      base = genderWord(
        p,
        ancestor ? translate("ui.grandmother") : translate("ui.granddaughter"),
        ancestor ? translate("ui.grandfather") : translate("ui.grandson"),
        ancestor ? translate("ui.grandparent") : translate("ui.grandchild"),
      );
    return (prefix + base).replace(/^./, (c) => c.toUpperCase());
  }
  return (
    (ancestor ? translate("ui.ancestor") : translate("ui.descendant")) +
    ` ${translate("ui.across")} ` +
    distance +
    ` ${translate("ui.generations")}`
  );
}
export function cousinName(level, p) {
  const name = {
    1: translate("ui.first"),
    2: translate("ui.second"),
    3: translate("ui.third"),
    4: translate("ui.fourth"),
    5: translate("ui.fifth"),
    6: translate("ui.sixth"),
  }[level];
  return name
    ? genderWord(
        p,
        name + translate("ui.cousin"),
        name + translate("ui.cousin2"),
        name + translate("ui.cousins"),
      )
    : `${translate("ui.relatives")} ` +
        (level + 1) +
        translate("ui.cousinDegree");
}
export function relationFromDistances(a, b, p) {
  const removed = Math.abs(a - b);
  if (a === 0)
    return {
      kind: "descendant",
      label: linealLabel(p, b, false),
    };
  if (b === 0)
    return {
      kind: "ancestor",
      label: linealLabel(p, a, true),
    };
  if (a === 1 && b === 1)
    return {
      kind: "sibling",
      label: genderWord(
        p,
        translate("ui.sister"),
        translate("ui.brother"),
        translate("ui.sibling"),
      ),
    };
  if (b === 1)
    return {
      kind: "aunt",
      label:
        a === 2
          ? genderWord(
              p,
              translate("ui.aunt"),
              translate("ui.uncle"),
              translate("ui.auntUncle"),
            )
          : translate("ui.yourAncestorSSibling"),
      detail:
        a === 2
          ? translate("ui.aSiblingOfOneOfYourParents")
          : `${translate("ui.relativeInAnOlderGeneration")} ` +
            (a - 1) +
            ` ${translate("ui.generationsFromYouToTheirSibling")}`,
    };
  if (a === 1)
    return {
      kind: "nephew",
      label:
        b === 2
          ? genderWord(
              p,
              translate("ui.niece"),
              translate("ui.nephew"),
              translate("ui.nieceNephew"),
            )
          : translate("ui.descendantOfYourSibling"),
      detail:
        b === 2
          ? translate("ui.yourSiblingSChild")
          : `${translate("ui.fromYourSiblingToThisPerson")} ` +
            (b - 1) +
            ` ${translate("ui.generations2")}`,
    };
  const degree = Math.min(a, b) - 1;
  const label = removed
    ? cousinName(degree, {
        gender: "u",
      }) +
      ` ${translate("ui.generationDifference")} ` +
      removed
    : cousinName(degree, p);
  const detail = removed
    ? b > a
      ? translate("ui.thisPersonDescendsFromYourCousinOfThe")
      : translate("ui.thisPersonIsACousinOfYourAncestor")
    : translate("ui.youAreEquallyManyGenerationsAwayFromThe");
  return {
    kind: "cousin",
    label,
    detail,
    degree,
    removed,
  };
}
export function familyPath(from, to) {
  const queue = [
      {
        id: from,
        people: [from],
        relations: [],
        steps: [],
      },
    ],
    seen = new Set();
  while (queue.length) {
    const node = queue.shift();
    if (node.id === to) return node;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    for (const r of appState.project.relations) {
      if (
        !["parent", "adopted", "spouse", "sibling"].includes(r.type) ||
        (r.from !== node.id && r.to !== node.id)
      )
        continue;
      const id = r.from === node.id ? r.to : r.from;
      if (seen.has(id)) continue;
      const step = ["parent", "adopted"].includes(r.type)
        ? r.from === node.id
          ? "child"
          : "parent"
        : r.type === "spouse"
          ? "partner"
          : "sibling";
      queue.push({
        id,
        people: [...node.people, id],
        relations: [...node.relations, r.id],
        steps: [...node.steps, step],
      });
    }
  }
  return null;
}
export function affinityLabel(path, target) {
  const steps = path.steps.join(",");
  if (steps === "child,partner,parent")
    return {
      label: genderWord(
        target,
        translate("ui.childSPartnerSMother"),
        translate("ui.childSPartnerSFather"),
        translate("ui.parentOfYourChildSPartner"),
      ),
      detail: translate("ui.aParentOfYourChildSPartner"),
    };
  if (steps === "partner,parent")
    return {
      label: genderWord(
        target,
        translate("ui.yourPartnerSMother"),
        translate("ui.yourPartnerSFather"),
        translate("ui.yourPartnerSParent"),
      ),
    };
  if (steps === "child,partner")
    return {
      label: genderWord(
        target,
        translate("ui.daughterInLawChildSPartner"),
        translate("ui.sonInLawChildSPartner"),
        translate("ui.yourChildSPartner"),
      ),
    };
  if (steps === "parent,partner")
    return {
      label: translate("ui.partnerOfOneOfYourParents"),
    };
  if (steps === "sibling,partner")
    return {
      label: translate("ui.yourSiblingSPartner"),
    };
  if (steps === "partner,sibling")
    return {
      label: translate("ui.yourPartnerSSibling"),
    };
  return {
    label: translate("ui.relativeThroughMarriagePartnership"),
    detail: translate("ui.aFamilyPathWithAMarriageOrPartnership"),
  };
}
export function kinshipBetween(from, to, affinity = true) {
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
  for (const r of appState.project.relations.filter(
    (r) => r.type === "sibling",
  )) {
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
  const spouse = appState.project.relations.find(
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
    for (const r of appState.project.relations.filter(
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
    for (const r of appState.project.relations.filter(
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
      ["acquaintance", "unconfirmed"].includes(r.type),
  );
  return other
    ? {
        found: false,
        kind: other.type,
        label:
          other.type === "acquaintance"
            ? translate("ui.acquaintanceKinshipNotEstablished")
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
