import { populateDemoDetails } from "./demo-details.js";
import { populateLifeRecords } from "./demo-life-records.js";
import { fresh } from "../model/project.js";
import { demoPeople, demoRelations } from "./demo-people.js";
import { populateDemoRecords } from "./demo-records.js";
import { demoSources } from "./demo-sources.js";
import { populateDemoFamilies } from "./families/build.js";
import { populateBranchProfiles } from "./families/profiles.js";
import { familyLayout } from "../graph/layouts/family.js";

export function sample() {
  const project = fresh();
  Object.assign(project, {
    title: "Doe and Roe families — fictional demo",
    purpose: "inheritance",
    demo: true,
    subjectId: "p1",
    claimantId: "p5",
    people: demoPeople(),
    relations: demoRelations(),
    documents: demoSources(),
    groups: [
      {
        id: "g1",
        name: "Doe / Roe family",
        color: "#54718a",
        notes: "Biological, adoptive and step-parent relationships.",
        collapsed: false,
        x: null,
        y: null,
      },
      {
        id: "g2",
        name: "Partner families and other connections",
        color: "#688d79",
        notes: "Former partners, relatives and research connections.",
        collapsed: false,
        x: null,
        y: null,
      },
    ],
  });
  populateDemoRecords(project);
  populateDemoDetails(project);
  populateDemoFamilies(project);
  populateBranchProfiles(project);
  populateLifeRecords(project);
  const layout = familyLayout(project);
  for (const kind of ["people", "documents", "property"])
    for (const record of project[kind])
      Object.assign(record, layout[kind].get(record.id));
  return project;
}
