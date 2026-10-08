import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { setLanguage } from "../src/i18n/index.js";
import { biographyProject } from "./fixtures/biography.js";

test("biography gathers all sources and property without applying workspace filters", () => {
  const project = biographyProject();
  const before = JSON.stringify(project);
  const biography = personBiography(project, "p5");
  assert.equal(project.purpose, "inheritance");
  assert.equal(biography.profile.biography, project.people[4].biography);
  assert.deepEqual(
    biography.groups.map((g) => g.id),
    ["g1"],
  );
  assert.deepEqual(
    biography.relations.map((r) => r.id),
    ["r5", "r6"],
  );
  assert.deepEqual(
    biography.property.map((a) => a.id),
    ["profile-property", "shared-property"],
  );
  assert.deepEqual(
    biography.documents.map((d) => d.id),
    [
      "d3",
      "bio-source",
      "health-source",
      "relationship-source",
      "property-source",
    ],
  );
  assert.equal(JSON.stringify(project), before);
  assert.equal(personBiography(project, "missing-person"), null);
});

test("biography renders every structured field, zero values and escaped user text in every language", () => {
  state.project = biographyProject();
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p5"));
    for (const value of [
      "Alex Morgan",
      "Recorded health details",
      "Watercolor painting",
      "Local history",
      "Graduation",
      "alex@example.org",
      "10 Example Street",
      "Example University",
      "Architecture",
      "Sunny",
      "Family studio",
      "Family book collection",
      "0 USD",
      "75%",
      "30%",
      "Relationship-only source",
      "Property-only source",
      "Recorded source text",
    ])
      assert.ok(html.includes(value), value);
    assert.ok(html.includes("Literal &lt;b&gt;text&lt;/b&gt;"));
    assert.ok(!html.includes("Literal <b>text</b>"));
    assert.ok(!html.includes("Unrelated source"));
  }
  setLanguage("en");
});
