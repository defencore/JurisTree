import { defineSection } from "./define.js";

export function educationSection() {
  return defineSection(
    "educationRecords",
    "ui.education",
    "book",
    "ui.educationRecord",
    [
      [
        null,
        [
          ["institution", "ui.educationalInstitution"],
          ["qualification", "ui.qualificationDegree"],
          ["field", "ui.fieldOfStudy"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.studyDetails",
        [
          ["level", "ui.educationLevel"],
          ["faculty", "ui.facultyDepartment"],
          ["location", "ui.place"],
          [
            "status",
            "ui.studyStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentStudies",
              completed: "ui.completedStudies",
              incomplete: "ui.incompleteStudies",
              other: "ui.other",
            },
          ],
          ["diplomaNumber", "ui.diplomaNumber"],
          ["graduatedAt", "ui.graduationDate", "date"],
          ["notes", "ui.notes", "textarea"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
    ],
    [["from", "to"]],
  );
}
