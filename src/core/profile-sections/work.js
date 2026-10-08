import { defineSection } from "./define.js";

export function workSection() {
  return defineSection(
    "occupations",
    "ui.workEducationService",
    "briefcase",
    "ui.workplaceSchool",
    [
      [
        null,
        [
          ["organization", "ui.institutionOrganization"],
          ["role", "ui.positionSpecialty"],
          [
            "kind",
            "ui.type",
            "select",
            {
              work: "ui.work",
              education: "ui.education",
              service: "ui.service",
              office: "ui.publicOffice",
              other: "ui.other",
            },
          ],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["location", "ui.place"],
        ],
      ],
      [
        "ui.appointmentAndIncome",
        [
          [
            "appointment",
            "ui.appointmentType",
            "select",
            {
              unspecified: "ui.notSpecified",
              employed: "ui.employed",
              appointed: "ui.appointed",
              elected: "ui.elected",
              selfEmployed: "ui.selfEmployed",
              other: "ui.other",
            },
          ],
          ["rank", "ui.rankGrade"],
          ["income", "ui.income", "number"],
          ["currency", "ui.currency"],
          [
            "payPeriod",
            "ui.paymentFrequency",
            "select",
            {
              unspecified: "ui.notSpecified",
              monthly: "ui.monthly",
              annual: "ui.annually",
              once: "ui.oneTimeEvent",
              other: "ui.other",
            },
          ],
          ["reference", "ui.appointmentReference"],
          ["notes", "ui.notes", "textarea"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
    ],
    [["from", "to"]],
  );
}
