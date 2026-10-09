import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";
import { translate } from "../../i18n/index.js";

export function medicalSection() {
  return defineSection(
    "medicalRecords",
    "ui.medicalHistory",
    "heartPulse",
    "ui.medicalRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.medicalRecordType",
            "select",
            {
              condition: "ui.illnessCondition",
              allergy: "ui.allergy",
              medication: "ui.medication",
              vaccination: "ui.vaccination",
              restriction: "ui.dietRestriction",
              allowedFood: "ui.allowedFood",
              record: "ui.medicalBookRecord",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.medicalDetails",
        [
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              active: "ui.active",
              resolved: "ui.resolved",
              historical: "ui.historical",
              other: "ui.other",
            },
          ],
          [
            "severity",
            "ui.severity",
            "select",
            {
              unspecified: "ui.notSpecified",
              mild: "ui.mild",
              moderate: "ui.moderate",
              severe: "ui.severe",
              other: "ui.other",
            },
          ],
          ["substance", "ui.allergenSubstance"],
          ["treatment", "ui.treatmentInstructions", "textarea"],
          ["foodAllowed", "ui.foodAllowed", "textarea"],
          ["foodAvoided", "ui.foodAvoided", "textarea"],
        ],
      ],
      [
        "ui.medicalDocumentDetails",
        [
          ["institution", "ui.providerInstitution"],
          ["practitioner", "ui.practitioner"],
          ["recordNumber", "ui.medicalRecordNumber"],
          ["date", "ui.recordDate", "date"],
          ["nextReviewDate", "ui.nextReviewDate", "date"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      sectionHint: translate("ui.healthSectionHint"),
      overview: {
        field: "health",
        sourceIds: "healthSourceIds",
        label: translate("ui.healthOverview"),
        maximumLength: 10000,
      },
      calendar: {
        type: "medical",
        dates: [
          ["date", "ui.recordDate"],
          ["nextReviewDate", "ui.nextReviewDate"],
          ["from", "ui.started"],
          ["to", "ui.ended"],
        ],
      },
    },
  );
}
