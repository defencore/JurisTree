import { translate } from "../i18n/index.js";

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
