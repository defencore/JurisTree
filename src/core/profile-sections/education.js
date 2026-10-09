import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

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
          [
            "institutionType",
            "ui.educationalInstitutionType",
            "select",
            {
              unspecified: "ui.notSpecified",
              school: "ui.school",
              vocational: "ui.vocationalInstitution",
              college: "ui.college",
              university: "ui.university",
              course: "ui.courseTraining",
              other: "ui.other",
            },
          ],
          ["qualification", "ui.qualificationDegree"],
          ["field", "ui.fieldOfStudy"],
          ["from", "ui.enrollmentDateYear", "period"],
          ["to", "ui.studyEndDateYear", "period"],
          ["graduatedAt", "ui.graduationDateYear", "period"],
        ],
      ],
      [
        "ui.studyDetails",
        [
          ["level", "ui.educationLevel"],
          ["faculty", "ui.facultyDepartment"],
          ["specialtyCode", "ui.specialtyCode"],
          ["studyMode", "ui.studyMode"],
          ["admissionReference", "ui.admissionReference"],
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
          ["diplomaSeries", "ui.diplomaSeries"],
          ["issuedAt", "ui.educationDocumentIssued", "period"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["from", "graduatedAt"],
    ],
    { coverage: { from: "from", to: "to", current: { status: ["current"] } } },
  );
}
