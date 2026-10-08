import { defineSection } from "./define.js";

export function personalSection() {
  return defineSection(
    "personalRecords",
    "ui.personalPortrait",
    "sparkles",
    "ui.personalProfileRecord",
    [
      [
        null,
        [
          [
            "category",
            "ui.category",
            "select",
            {
              character: "ui.characterAndTemperament",
              habits: "ui.habits",
              routine: "ui.dailyRoutine",
              values: "ui.valuesAndBeliefs",
              religion: "ui.religiousViews",
              politics: "ui.politicalViews",
              preferences: "ui.personalPreferences",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.contextAndAttribution",
        [
          [
            "basis",
            "ui.informationBasis",
            "select",
            {
              unspecified: "ui.notSpecified",
              self: "ui.selfReported",
              observation: "ui.recordedObservation",
              source: "ui.documentedSource",
            },
          ],
          ["reportedBy", "ui.reportedRecordedBy"],
          ["recordedAt", "ui.recordedOn", "date"],
          ["frequency", "ui.frequencyContext"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["notes", "ui.notes", "textarea"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
    ],
    [["from", "to"]],
  );
}
