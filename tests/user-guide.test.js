import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { guideExampleProject, guidePeople } from "../src/data/guide-example.js";
import { setLanguage, translate } from "../src/i18n/index.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { validateImport } from "../src/model/validation.js";
import { renderUserGuide } from "../src/ui/user-guide.js";

test("practice project imports with shared profiles, surname histories and derived cousin relationships", () => {
  setLanguage("en");
  state.project = validateImport(
    JSON.parse(JSON.stringify(guideExampleProject())),
  );
  const project = state.project;
  assert.equal(project.people.length, 8);
  assert.equal(project.groups.length, 3);
  assert.equal(project.relations.length, 11);
  assert.equal(project.documents.length, 0);
  assert.equal(project.demo, true);
  assert.equal(kinshipBetween("guide-jamie", "guide-taylor").kind, "sibling");
  const cousins = kinshipBetween("guide-robin", "guide-avery");
  assert.equal(cousins.found, true);
  assert.equal(cousins.degree, 1);
  assert.equal(kinshipBetween("guide-robin", "guide-alex").kind, "ancestor");
  assert.equal(
    project.people.find((p) => p.id === "guide-jamie").groupIds.length,
    2,
  );
  assert.equal(
    project.people.find((p) => p.id === "guide-casey").nameHistory[0].surname,
    "Hart",
  );
  assert.equal(
    project.people.find((p) => p.id === "guide-taylor").nameHistory[0].surname,
    "Doe",
  );
  assert.deepEqual(validateImport(project), project);
});

test("downloading another practice project cannot reuse a modified example", () => {
  const first = guideExampleProject();
  first.people[0].name = "Changed";
  first.people[0].groupIds.push("another-group");
  first.groups[0].name = "Changed group";
  first.relations[0].from = "another-person";
  const next = guideExampleProject();
  assert.equal(next.people[0].name, "Alex Doe");
  assert.equal(next.people[0].groupIds.length, 1);
  assert.equal(next.groups[0].name, "Alex & Morgan Doe");
  assert.equal(next.relations[0].from, "guide-alex");
});

test("every guide language resolves actual control labels and displays the complete exercise", () => {
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderUserGuide();
    assert.equal((html.match(/data-guide-lesson=/g) || []).length, 8);
    assert.equal((html.match(/<li><span>/g) || []).length, 11);
    for (const person of guidePeople) assert.ok(html.includes(person.name));
    for (const key of [
      "ui.registeredMarriage",
      "ui.biologicalParenthood",
      "ui.editProfile",
      "ui.printBiography",
      "ui.import2",
    ])
      assert.ok(html.includes(translate(key)), `${language}: ${key}`);
    assert.doesNotMatch(html, /\{\w+\}/);
    assert.doesNotMatch(html, /@@ui\.|undefined/);
    assert.equal(
      guideExampleProject().title,
      translate("ui.guideExampleProjectTitle"),
    );
  }
  setLanguage("en");
});
