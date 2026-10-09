import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";
import { translate } from "../../i18n/index.js";

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
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          [
            "timeStatus",
            "ui.activityPeriodStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentActivity",
              past: "ui.pastActivity",
              paused: "ui.pausedActivity",
              planned: "ui.plannedActivity",
            },
          ],
        ],
      ],
      ["ui.periodAndFrequency", [["frequency", "ui.frequencyContext"]]],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      sectionHint: translate("ui.personalSectionHint"),
      calendar: {
        type: "personal",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
        ],
      },
    },
  );
}
