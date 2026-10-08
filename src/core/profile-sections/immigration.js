import { defineSection } from "./define.js";

export function immigrationSection() {
  return defineSection(
    "immigrationRecords",
    "ui.citizenshipAndImmigration",
    "landmark",
    "ui.immigrationRecord",
    [
      [
        null,
        [
          ["country", "ui.country"],
          [
            "status",
            "ui.residenceStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              citizen: "ui.citizen",
              visa: "ui.visa",
              temporary: "ui.temporaryResidence",
              permanent: "ui.permanentResidence",
              protection: "ui.internationalProtection",
              other: "ui.other",
            },
          ],
          ["category", "ui.visaPermitCategory"],
          ["permitNumber", "ui.permitNumber"],
          ["from", "ui.validFrom", "period"],
          ["to", "ui.validUntil", "period"],
        ],
      ],
      [
        "ui.applicationDetails",
        [
          ["caseNumber", "ui.caseNumber"],
          ["authority", "ui.issuingAuthority"],
          ["applicationDate", "ui.applicationDate", "date"],
          ["decisionDate", "ui.decisionDate", "date"],
          ["citizenshipBasis", "ui.citizenshipBasis"],
          ["purpose", "ui.purposeOfStay"],
          ["sponsor", "ui.sponsorEmployer"],
        ],
      ],
      [
        "ui.travelAndResidence",
        [
          ["entryDate", "ui.entryDate", "date"],
          ["exitDate", "ui.exitDate", "date"],
          ["address", "ui.residentialAddress"],
          ["conditions", "ui.permitConditions", "textarea"],
        ],
      ],
      [
        "ui.notesAndSources",
        [
          ["notes", "ui.additionalDetails", "textarea"],
          ["sourceId", "ui.sourceScan", "source"],
        ],
      ],
    ],
    [
      ["from", "to"],
      ["applicationDate", "decisionDate"],
      ["entryDate", "exitDate"],
    ],
  );
}
