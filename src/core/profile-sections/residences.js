import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function residencesSection() {
  return defineSection(
    "residences",
    "ui.residenceHistory",
    "mapPin",
    "ui.residence",
    [
      [
        null,
        [
          ["country", "ui.country"],
          ["city", "ui.city"],
          ["address", "ui.residentialAddress"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.residenceDetails",
        [
          ["region", "ui.region"],
          ["postalCode", "ui.postalCode"],
          [
            "kind",
            "ui.residenceType",
            "select",
            {
              unspecified: "ui.notSpecified",
              home: "ui.homeResidence",
              temporary: "ui.temporaryResidence",
              work: "ui.work",
              study: "ui.education",
              other: "ui.other",
            },
          ],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentResidence",
              former: "ui.formerResidence",
              planned: "ui.planned",
              other: "ui.other",
            },
          ],
          ["permitReference", "ui.visaPermitReference"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      coverage: { from: "from", to: "to", current: { status: ["current"] } },
      calendar: {
        type: "residence",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
        ],
      },
    },
  );
}
