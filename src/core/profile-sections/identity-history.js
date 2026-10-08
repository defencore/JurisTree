import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function identityHistorySection() {
  return defineSection(
    "identityHistory",
    "ui.genderOrientationHistory",
    "user",
    "ui.identityHistoryRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.category",
            "select",
            {
              gender: "ui.genderIdentity",
              legalSex: "ui.legalSex",
              orientation: "ui.sexualOrientation",
              hormones: "ui.hormoneTreatment",
              surgery: "ui.surgicalProcedure",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["value", "ui.selfDescription"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.procedureDetails",
        [
          ["date", "ui.procedureDate", "date"],
          ["provider", "ui.providerInstitution"],
          ["country", "ui.country"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
  );
}
