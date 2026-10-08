import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";
import { translate } from "../../i18n/index.js";

export function pregnancySection() {
  return defineSection(
    "pregnancyRecords",
    "ui.pregnancyHistory",
    "baby",
    "ui.pregnancyRecord",
    [
      [
        null,
        [
          ["title", "ui.label"],
          [
            "outcome",
            "ui.pregnancyOutcome",
            "select",
            {
              unknown: "ui.unknown",
              ongoing: "ui.ongoingPregnancy",
              liveBirth: "ui.liveBirth",
              stillbirth: "ui.stillbirth",
              miscarriage: "ui.miscarriage",
              termination: "ui.inducedTermination",
              medicalTermination: "ui.medicalTermination",
              ectopic: "ui.ectopicPregnancy",
              other: "ui.other",
            },
          ],
          ["from", "ui.pregnancyStart", "period"],
          ["expectedDate", "ui.expectedDeliveryDate", "date"],
          ["to", "ui.pregnancyEnd", "period"],
        ],
      ],
      [
        "ui.pregnancyDetails",
        [
          ["otherParentId", "ui.recordedOtherParent", "person"],
          ["otherParentName", "ui.externalOtherParent"],
          [
            "parentageStatus",
            "ui.parentageVerification",
            "select",
            {
              unknown: "ui.unknown",
              reported: "ui.personalReport",
              corroborated: "ui.corroborated",
              refuted: "ui.refuted",
            },
          ],
          ["childId", "ui.linkedChild", "person"],
          ["gestationWeeks", "ui.gestationWeeks", "number"],
          ["fetuses", "ui.fetusCount", "number"],
          ["circumstances", "ui.circumstances", "textarea"],
          ["provider", "ui.providerInstitution"],
          ["recordNumber", "ui.medicalRecordNumber"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["from", "expectedDate"],
    ],
    {
      hint: translate("ui.pregnancyParentageHint"),
      validate: (record) =>
        record.outcome === "ongoing" && record.to
          ? translate("ui.ongoingPregnancyEndError")
          : "",
      numericMinimums: { gestationWeeks: 0, fetuses: 1 },
      calendar: {
        type: "pregnancy",
        dates: [
          ["from", "ui.pregnancyStart"],
          ["expectedDate", "ui.expectedDeliveryDate"],
          ["to", "ui.pregnancyEnd"],
        ],
      },
    },
  );
}
