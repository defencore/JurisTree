import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function militarySection() {
  return defineSection(
    "militaryRecords",
    "ui.militaryHistory",
    "shield",
    "ui.militaryRecord",
    [
      [
        null,
        [
          ["title", "ui.label"],
          [
            "kind",
            "ui.militaryRecordType",
            "select",
            {
              service: "ui.militaryService",
              registration: "ui.militaryRegistration",
              reserve: "ui.reserveService",
              training: "ui.militaryTraining",
              award: "ui.militaryAward",
              discharge: "ui.militaryDischarge",
              other: "ui.other",
            },
          ],
          ["country", "ui.country"],
          ["branch", "ui.serviceBranch"],
          ["unit", "ui.militaryUnit"],
          ["role", "ui.positionSpecialty"],
          ["rank", "ui.militaryRank"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          [
            "status",
            "ui.serviceStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              active: "ui.activeService",
              reserve: "ui.reserveService",
              completed: "ui.completedService",
              exempted: "ui.exemptFromService",
              other: "ui.other",
            },
          ],
        ],
      ],
      [
        "ui.militaryDocument",
        [
          ["documentType", "ui.documentType"],
          ["series", "ui.documentSeries"],
          ["documentNumber", "ui.documentNumber"],
          ["serviceNumber", "ui.serviceNumber"],
          ["issuedBy", "ui.issuingAuthority"],
          ["issueDate", "ui.issueDate", "date"],
          ["registrationOffice", "ui.militaryRegistrationOffice"],
          ["specialty", "ui.militarySpecialty"],
          ["fitnessCategory", "ui.recordedFitnessCategory"],
          ["location", "ui.place"],
          ["appointmentReference", "ui.appointmentReference"],
          ["dischargeDate", "ui.dischargeDate", "date"],
          ["dischargeReason", "ui.dischargeReason", "textarea"],
        ],
      ],
      [
        "ui.militaryAwards",
        [
          ["awardName", "ui.awardName"],
          ["awardGrade", "ui.awardGrade"],
          ["awardDate", "ui.awardDate", "date"],
          ["awardedBy", "ui.awardedBy"],
          ["decreeNumber", "ui.awardDecreeNumber"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["from", "dischargeDate"],
    ],
    {
      coverage: {
        from: "from",
        to: "to",
        current: { status: ["active", "reserve"] },
        kinds: ["service", "reserve", "training"],
      },
      calendar: {
        type: "military",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["issueDate", "ui.issueDate"],
          ["dischargeDate", "ui.dischargeDate"],
          ["awardDate", "ui.awardDate"],
        ],
      },
    },
  );
}
