import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";
import { translate } from "../../i18n/index.js";

export function skillsSection() {
  return defineSection(
    "skillRecords",
    "ui.activitiesAndSkills",
    "sparkles",
    "ui.skillRecord",
    [
      [
        null,
        [
          ["name", "ui.skillActivityName"],
          [
            "category",
            "ui.category",
            "select",
            {
              unspecified: "ui.notSpecified",
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
          ["description", "ui.description", "textarea"],
        ],
      ],
      [
        "ui.periodAndFrequency",
        [
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
        ],
      ],
      [
        "ui.levelAndQualifications",
        [
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
      sectionHint: translate("ui.activitiesAndSkillsHint"),
      // Reserve two records for imported hobby and interest summaries.
      maximumRecords: 202,
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
