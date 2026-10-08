/** Shared record attribution, kept explicit rather than inferred from other profile data. */
export const attributionGroup = [
  "ui.contextAndAttribution",
  [
    [
      "basis",
      "ui.informationBasis",
      "select",
      {
        unspecified: "ui.notSpecified",
        self: "ui.selfReported",
        source: "ui.documentedSource",
        observation: "ui.recordedObservation",
      },
    ],
    ["reportedBy", "ui.reportedRecordedBy"],
    ["recordedAt", "ui.recordedOn", "date"],
    [
      "verification",
      "ui.verificationStatus",
      "select",
      {
        pending: "ui.pendingVerification",
        corroborated: "ui.corroborated",
        refuted: "ui.refuted",
        inconclusive: "ui.inconclusive",
      },
    ],
    ["notes", "ui.notes", "textarea"],
    ["sourceId", "ui.source", "source"],
  ],
];
