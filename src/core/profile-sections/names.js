import { defineSection } from "./define.js";

export function namesSection() {
  return defineSection(
    "nameHistory",
    "ui.nameHistory",
    "history",
    "ui.nameRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.nameKind",
            "select",
            {
              maiden: "ui.maidenName",
              birth: "ui.birthName",
              legal: "ui.legalName",
              previous: "ui.previousName",
              alias: "ui.aliasName",
              other: "ui.other",
            },
          ],
          ["fullName", "ui.fullName"],
          ["surname", "ui.surname"],
          ["givenName", "ui.givenName"],
          ["patronymic", "ui.patronymic"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.notesAndSources",
        [
          ["reason", "ui.nameChangeReason"],
          ["country", "ui.country"],
          ["notes", "ui.notes", "textarea"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
    ],
    [["from", "to"]],
  );
}
