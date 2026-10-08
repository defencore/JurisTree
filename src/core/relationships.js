import { defineSection } from "./profile-sections/define.js";

export function relationshipConfig() {
  return defineSection(
    "",
    "ui.relationshipDetails",
    "link",
    "ui.relationshipDetails",
    [
      [
        null,
        [
          [
            "unionKind",
            "ui.unionKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              marriage: "ui.registeredMarriage",
              civil: "ui.civilPartnership",
              religious: "ui.religiousMarriage",
              unregistered: "ui.unregisteredPartnership",
              cohabitation: "ui.cohabitation",
              dating: "ui.dating",
              romantic: "ui.romanticRelationship",
              other: "ui.other",
            },
          ],
          [
            "status",
            "ui.relationshipStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentRelationship",
              ended: "ui.endedRelationship",
              separated: "ui.separated",
              divorced: "ui.divorced",
              widowed: "ui.widowed",
              other: "ui.other",
            },
          ],
          [
            "duration",
            "ui.relationshipDuration",
            "select",
            {
              unspecified: "ui.notSpecified",
              longTerm: "ui.longTerm",
              temporary: "ui.temporary",
              occasional: "ui.occasional",
              other: "ui.other",
            },
          ],
          ["fromDate", "ui.from", "period"],
          ["toDate", "ui.to", "period"],
          ["place", "ui.place"],
          ["registration", "ui.registrationReference"],
        ],
      ],
      [
        "ui.relationshipContext",
        [
          [
            "quality",
            "ui.relationshipQuality",
            "select",
            {
              unspecified: "ui.notSpecified",
              good: "ui.goodRelationship",
              neutral: "ui.neutralRelationship",
              difficult: "ui.difficultRelationship",
              hostile: "ui.hostileRelationship",
              mixed: "ui.mixedRelationship",
            },
          ],
          [
            "context",
            "ui.relationshipContextType",
            "select",
            {
              unspecified: "ui.notSpecified",
              friendship: "ui.friendship",
              family: "ui.familyContext",
              professional: "ui.professionalContext",
              business: "ui.businessContext",
              neighbour: "ui.neighbourContext",
              romantic: "ui.romanticRelationship",
              conflict: "ui.conflictContext",
              other: "ui.other",
            },
          ],
          ["contextNotes", "ui.relationshipContextDetails", "textarea"],
        ],
      ],
      [
        "ui.verificationDetails",
        [
          [
            "verification",
            "ui.verificationStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              unverified: "ui.pendingVerification",
              confirmed: "ui.corroborated",
              disputed: "ui.disputedRelationship",
              refuted: "ui.refuted",
            },
          ],
          ["reportedBy", "ui.reportedRecordedBy"],
          ["reportedAt", "ui.reportedOn", "date"],
          ["verificationNotes", "ui.verificationNotes", "textarea"],
        ],
      ],
    ],
    [["fromDate", "toDate"]],
  ).config;
}

/** Social, explicitly unverified and ended marital connections do not establish current kinship. */
export function familyConnection(r) {
  return (
    ["parent", "adopted", "spouse", "sibling"].includes(r.type) &&
    !["unverified", "refuted"].includes(r.verification) &&
    !(r.type === "spouse" && ["ended", "divorced"].includes(r.status))
  );
}

export function relationshipFields(type) {
  const cfg = relationshipConfig();
  const partnership = ["spouse", "partner"].includes(type);
  const allowed =
    type === "spouse"
      ? ["unspecified", "marriage", "civil", "religious", "other"]
      : [
          "unspecified",
          "unregistered",
          "cohabitation",
          "dating",
          "romantic",
          "other",
        ];
  return {
    ...cfg,
    groups: cfg.groups.map((group) => ({
      ...group,
      fields: group.fields
        .filter(
          ([key]) =>
            partnership ||
            !["unionKind", "status", "duration", "registration"].includes(key),
        )
        .map((entry) =>
          entry[0] === "unionKind"
            ? [
                ...entry.slice(0, 3),
                Object.fromEntries(
                  Object.entries(entry[3]).filter(([key]) =>
                    allowed.includes(key),
                  ),
                ),
              ]
            : entry,
        ),
    })),
  };
}

export function collectRelationship(form) {
  const type = form.get("type");
  const cfg = relationshipFields(type);
  const allowed = new Map(
    cfg.groups
      .flatMap((group) => group.fields)
      .map((entry) => [entry[0], entry]),
  );
  return Object.fromEntries(
    relationshipConfig().fields.map(([key, , kind, options]) => {
      let value = allowed.has(key)
        ? String(form.get("relationship-" + key) || "").trim()
        : "";
      if (kind === "select") {
        options = allowed.get(key)?.[3] || options;
        if (!Object.hasOwn(options, value)) value = Object.keys(options)[0];
      }
      return [key, value];
    }),
  );
}

export function duplicateRelationship(relations, candidate, except) {
  return relations.some(
    (r) =>
      r.id !== except &&
      r.type === candidate.type &&
      ((r.from === candidate.from && r.to === candidate.to) ||
        (!["parent", "adopted", "step_parent"].includes(r.type) &&
          r.to === candidate.from &&
          r.from === candidate.to)) &&
      (["parent", "adopted", "step_parent", "sibling"].includes(r.type) ||
        ["unionKind", "fromDate", "toDate"].every(
          (key) =>
            (r[key] || "unspecified") === (candidate[key] || "unspecified"),
        )),
  );
}
