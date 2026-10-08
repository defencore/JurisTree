import { defineSection } from "./define.js";

export function customSection() {
  return defineSection(
    "customFacts",
    "ui.additionalProfileFacts",
    "notebook",
    "ui.additionalFact",
    [
      [
        null,
        [
          ["category", "ui.category"],
          ["title", "ui.label"],
          ["value", "ui.valueDetails", "textarea"],
        ],
      ],
      [
        "ui.notesAndSources",
        [
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
