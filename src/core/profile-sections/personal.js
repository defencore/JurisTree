import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

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
              food: "ui.foodPreferences",
              attraction: "ui.attractionPreferences",
              lifestyle: "ui.lifestyleActivities",
              charity: "ui.charityActivity",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.periodAndFrequency",
        [
          ["frequency", "ui.frequencyContext"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
  );
}
