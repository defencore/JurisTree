import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function appearanceSection() {
  return defineSection(
    "appearanceRecords",
    "ui.appearanceMeasurements",
    "user",
    "ui.appearanceRecord",
    [
      [
        null,
        [
          ["title", "ui.label"],
          ["heightCm", "ui.heightCm", "number"],
          ["weightKg", "ui.weightKg", "number"],
          ["build", "ui.bodyBuild"],
          ["eyeColor", "ui.eyeColor"],
          ["hairColor", "ui.hairColor"],
          [
            "glasses",
            "ui.glassesUse",
            "select",
            {
              unspecified: "ui.notSpecified",
              yes: "ui.wearsGlasses",
              no: "ui.doesNotWearGlasses",
              sometimes: "ui.sometimesGlasses",
            },
          ],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.distinctiveFeatures",
        [
          ["marks", "ui.distinctiveFeatures", "textarea"],
          ["tattoos", "ui.tattoosScars", "textarea"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    { numericMinimums: { heightCm: 0, weightKg: 0 } },
  );
}
