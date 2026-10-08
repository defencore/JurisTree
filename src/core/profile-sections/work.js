import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

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
          [
            "status",
            "ui.employmentStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentEmployment",
              former: "ui.formerEmployment",
              other: "ui.other",
            },
          ],
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
          ["country", "ui.country"],
          ["address", "ui.address"],
          ["department", "ui.department"],
          ["contract", "ui.contractDetails"],
          ["supervisor", "ui.supervisor"],
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
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    { coverage: { from: "from", to: "to", current: { status: ["current"] } } },
  );
}
