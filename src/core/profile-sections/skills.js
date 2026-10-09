import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function skillsSection() {
  return defineSection(
    "skillRecords",
    "ui.skillsHobbies",
    "sparkles",
    "ui.skillRecord",
    [
      [
        null,
        [
          [
            "category",
            "ui.category",
            "select",
            {
              skill: "ui.skill",
              hobby: "ui.hobbies",
              interest: "ui.interests",
              sport: "ui.sport",
              martialArt: "ui.martialArt",
              weapons: "ui.weaponsProficiency",
              teaching: "ui.teachingActivity",
              construction: "ui.constructionActivity",
              development: "ui.developmentActivity",
              other: "ui.other",
            },
          ],
          ["name", "ui.skillActivityName"],
          [
            "level",
            "ui.proficiencyLevel",
            "select",
            {
              unspecified: "ui.notSpecified",
              beginner: "ui.beginner",
              intermediate: "ui.intermediate",
              advanced: "ui.advanced",
              professional: "ui.professional",
              other: "ui.other",
            },
          ],
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
          ["frequency", "ui.frequencyContext"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.qualifications",
        [
          ["qualification", "ui.qualification"],
          ["issuer", "ui.issuingAuthority"],
          ["certificateNumber", "ui.certificateNumber"],
          ["expiryDate", "ui.validUntil", "date"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      calendar: {
        type: "skill",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["expiryDate", "ui.validUntil"],
        ],
      },
    },
  );
}
