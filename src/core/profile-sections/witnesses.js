import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function witnessesSection() {
  return defineSection(
    "witnessRecords",
    "ui.witnessesAndTestimony",
    "users",
    "ui.witnessRecord",
    [
      [
        null,
        [
          ["eventTitle", "ui.witnessedEvent"],
          ["eventDate", "ui.eventDate", "period"],
          ["eventPlace", "ui.eventPlace"],
          ["witnessId", "ui.linkedWitness", "person"],
          ["witnessName", "ui.externalWitnessName"],
          [
            "role",
            "ui.witnessRole",
            "select",
            {
              unspecified: "ui.notSpecified",
              eyewitness: "ui.eyewitness",
              participant: "ui.eventParticipant",
              recipient: "ui.statementRecipient",
              hearsay: "ui.hearsay",
              other: "ui.other",
            },
          ],
          ["statement", "ui.reportedStatement", "textarea"],
        ],
      ],
      [
        "ui.witnessContactDetails",
        [
          ["contact", "ui.witnessContact"],
          ["interviewDate", "ui.interviewDate", "date"],
          ["statementReference", "ui.statementReference"],
          [
            "availability",
            "ui.witnessAvailability",
            "select",
            {
              unknown: "ui.unknown",
              available: "ui.available",
              unreachable: "ui.unreachableWitness",
              declined: "ui.declinedStatement",
              deceased: "ui.deceased",
            },
          ],
          ["checkedBy", "ui.checkedBy"],
          ["checkedAt", "ui.checkedOn", "date"],
          ["verificationNotes", "ui.verificationNotes", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [],
    {
      calendar: {
        type: "testimony",
        dates: [
          ["eventDate", "ui.witnessedEvent"],
          ["interviewDate", "ui.interviewDate"],
        ],
      },
    },
  );
}
