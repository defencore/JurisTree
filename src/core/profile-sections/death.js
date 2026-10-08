import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";
import { translate } from "../../i18n/index.js";

export function deathSection() {
  return defineSection(
    "deathRecords",
    "ui.deathCircumstances",
    "heart",
    "ui.deathRecord",
    [
      [
        null,
        [
          ["title", "ui.label"],
          ["date", "ui.deathDateLabel", "period"],
          [
            "category",
            "ui.deathCategory",
            "select",
            {
              unknown: "ui.unknown",
              natural: "ui.naturalDeath",
              illness: "ui.deathFromIllness",
              accident: "ui.accidentalDeath",
              violent: "ui.violentDeath",
              combat: "ui.combatDeath",
              undetermined: "ui.undeterminedDeath",
              other: "ui.other",
            },
          ],
          ["cause", "ui.recordedCauseOfDeath"],
          ["country", "ui.country"],
          ["place", "ui.place"],
          ["circumstances", "ui.circumstances", "textarea"],
        ],
      ],
      [
        "ui.deathInvestigation",
        [
          ["authority", "ui.courtAuthority"],
          ["caseNumber", "ui.caseNumber"],
          ["conclusion", "ui.officialConclusion", "textarea"],
          ["certificateNumber", "ui.deathCertificateNumber"],
          ["certificateDate", "ui.certificateDate", "date"],
          ["burialDate", "ui.burialDate", "date"],
          ["burialPlace", "ui.burialPlace"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["date", "certificateDate"],
      ["date", "burialDate"],
    ],
    {
      hint: translate("ui.deathRecordHint"),
      calendar: {
        type: "deathDetails",
        dates: [
          ["date", "ui.deathDateLabel"],
          ["burialDate", "ui.burialDate"],
        ],
      },
    },
  );
}
