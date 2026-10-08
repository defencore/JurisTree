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
              formerCitizen: "ui.formerCitizen",
              stateless: "ui.stateless",
              applicant: "ui.statusApplicant",
              resident: "ui.resident",
              permit: "ui.residencePermit",
              asylum: "ui.asylumSeeker",
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
        "ui.citizenshipChanges",
        [
          [
            "change",
            "ui.citizenshipChangeType",
            "select",
            {
              unspecified: "ui.notSpecified",
              acquired: "ui.citizenshipAcquired",
              renounced: "ui.citizenshipRenounced",
              lost: "ui.citizenshipLost",
              restored: "ui.citizenshipRestored",
              changed: "ui.citizenshipChanged",
              other: "ui.other",
            },
          ],
          ["previousCountry", "ui.previousCitizenship"],
          ["changeDate", "ui.citizenshipChangeDate", "date"],
          ["residenceType", "ui.residencyType"],
          ["statusReason", "ui.statusReason", "textarea"],
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
    {
      calendar: {
        type: "immigration",
        dates: [
          ["from", "ui.validFrom"],
          ["to", "ui.validUntil"],
          ["changeDate", "ui.citizenshipChangeDate"],
          ["applicationDate", "ui.applicationDate"],
          ["decisionDate", "ui.decisionDate"],
          ["entryDate", "ui.entryDate"],
          ["exitDate", "ui.exitDate"],
        ],
      },
    },
  );
}
