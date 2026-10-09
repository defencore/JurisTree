const custodyKinds = new Set(["detention", "imprisonment", "release"]);

/** Normalize earlier mixed history at the archive/draft boundary, retaining record identifiers and source information. */
export function migrateProfileHistory(profile) {
  if (
    [
      "legalRecords",
      "custodyRecords",
      "events",
      "occupations",
      "educationRecords",
    ].some((key) => profile[key] != null && !Array.isArray(profile[key]))
  )
    return profile;
  const legal = profile.legalRecords || [];
  const moved = legal.filter((r) => r && custodyKinds.has(r.kind));
  const legalEvents = (profile.events || []).filter(
    (r) => r?.category === "legal",
  );
  const studies = (profile.occupations || []).filter(
    (r) => r?.kind === "education",
  );
  if (!moved.length && !legalEvents.length && !studies.length) return profile;
  return {
    ...profile,
    legalRecords: [
      ...legal.filter((r) => !moved.includes(r)),
      ...legalEvents.map((r) => ({ ...r, kind: "other" })),
    ],
    custodyRecords: [...(profile.custodyRecords || []), ...moved],
    events: (profile.events || []).filter((r) => !legalEvents.includes(r)),
    occupations: (profile.occupations || []).filter(
      (r) => !studies.includes(r),
    ),
    educationRecords: [
      ...(profile.educationRecords || []),
      ...studies.map((r) => {
        const mapped = new Set([
          "id",
          "kind",
          "organization",
          "role",
          "from",
          "to",
          "location",
          "status",
          "sourceId",
          "notes",
          "basis",
          "verification",
          "reportedBy",
          "recordedAt",
          "reviewNotes",
        ]);
        const extra = Object.entries(r)
          .filter(
            ([key, value]) => !mapped.has(key) && value !== "" && value != null,
          )
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        return {
          id: r.id,
          institution: r.organization,
          field: r.role,
          from: r.from,
          to: r.to,
          location: r.location,
          status: r.status === "current" ? "current" : "unspecified",
          sourceId: r.sourceId,
          basis: r.basis,
          verification: r.verification,
          reportedBy: r.reportedBy,
          recordedAt: r.recordedAt,
          reviewNotes: r.reviewNotes,
          notes: [r.notes, extra].filter(Boolean).join("\n"),
        };
      }),
    ],
  };
}
