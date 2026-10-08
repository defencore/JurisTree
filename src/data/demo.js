import { populateDemoDetails } from "./demo-details.js";
import { fresh } from "../model/project.js";
import { demoPeople, demoRelations } from "./demo-people.js";
import { populateDemoRecords } from "./demo-records.js";
import { demoSources } from "./demo-sources.js";

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
        notes:
          "Fictional family with surname changes, biological and adoptive parents.",
        collapsed: false,
        x: null,
        y: null,
      },
      {
        id: "g2",
        name: "Other fictional connections",
        color: "#688d79",
        notes: "Fictional former partners, relatives and research connections.",
        collapsed: false,
        x: null,
        y: null,
      },
    ],
  });
  populateDemoRecords(project);
  populateDemoDetails(project);
  return project;
}
