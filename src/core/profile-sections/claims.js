import { defineSection } from "./define.js";

export function claimsSection() {
  return defineSection(
    "claims",
    "ui.claimsAndReports",
    "help",
    "ui.claimRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.informationKind",
            "select",
            {
              report: "ui.personalReport",
              rumor: "ui.rumor",
              testimony: "ui.witnessTestimony",
              recording: "ui.recording",
              infidelity: "ui.reportedInfidelity",
              biographyGap: "ui.biographyClarification",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["statement", "ui.reportedStatement", "textarea"],
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
        ],
      ],
      [
        "ui.contextAndAttribution",
        [
          ["relatedPersonId", "ui.relatedPerson", "person"],
          ["reportedBy", "ui.reportedRecordedBy"],
          ["reportedAt", "ui.reportedOn", "date"],
          [
            "basis",
            "ui.informationBasis",
            "select",
            {
              unspecified: "ui.notSpecified",
              direct: "ui.firstHandAccount",
              hearsay: "ui.hearsay",
              recording: "ui.recording",
              other: "ui.other",
            },
          ],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
      [
        "ui.verificationDetails",
        [
          ["checkedBy", "ui.checkedBy"],
          ["checkedAt", "ui.checkedOn", "date"],
          ["verificationNotes", "ui.verificationNotes", "textarea"],
          ["notes", "ui.notes", "textarea"],
        ],
      ],
    ],
    [["from", "to"]],
  );
}
