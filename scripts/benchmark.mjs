import { performance } from "node:perf_hooks";
import { state } from "../src/core/state.js";
import { recordConfigs, sectionInfo } from "../src/core/config.js";
import { sample } from "../src/data/demo.js";
import { personBiography } from "../src/model/biography.js";
import { withProjectIndex } from "../src/model/project.js";
import { buildSearchIndex } from "../src/model/search.js";

const demo = sample(),
  large = structuredClone(demo);
const collections = ["people", "relations", "documents", "property", "groups"];
const ids = new Set(
  collections.flatMap((key) => demo[key].map((item) => item.id)),
);
for (let cohort = 1; cohort < 6; cohort++) {
  const branch = JSON.parse(JSON.stringify(demo), (_key, value) =>
    typeof value === "string" && ids.has(value)
      ? `${value}-cohort-${cohort}`
      : value,
  );
  for (const key of collections) large[key].push(...branch[key]);
}
function measure(name, calculate) {
  calculate();
  const timings = Array.from({ length: 7 }, () => {
    const start = performance.now();
    calculate();
    return performance.now() - start;
  }).sort((a, b) => a - b);
  console.log(`${name}: ${timings[3].toFixed(2)} ms median`);
}
console.log(
  `Search fixture: ${large.people.length} people, ${large.relations.length} relationships, ${large.documents.length} sources`,
);
measure("500 profile catalog requests", () => {
  for (let i = 0; i < 500; i++) {
    recordConfigs();
    sectionInfo();
  }
});
measure("Demo search index", () => buildSearchIndex(demo));
measure("Large search index", () => buildSearchIndex(large));
measure("Demo profile directory data", () => {
  state.project = demo;
  withProjectIndex(() =>
    demo.people.map((person) => personBiography(demo, person.id)),
  );
});
