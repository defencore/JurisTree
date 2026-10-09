import test from "node:test";
import assert from "node:assert/strict";
import {
  profileCatalog,
  profileSectionCount,
} from "../src/core/profile-catalog.js";
import { sectionInfo } from "../src/core/config.js";
import { setLanguage } from "../src/i18n/index.js";
import { sample } from "../src/data/demo.js";
import { renderPersonForm } from "../src/ui/forms/person.js";
import { state } from "../src/core/state.js";
import { onSignal } from "../src/core/signals.js";
import { commit, undo, redo } from "../src/services/history.js";

test("the complete editor exposes every section and searchable field regardless of purpose visibility", () => {
  state.project = sample();
  state.project.scopePreferences[state.project.purpose] = [];
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const catalog = profileCatalog().flatMap((group) => group.sections);
    assert.deepEqual(
      catalog.map(({ key }) => key),
      Object.keys(sectionInfo()),
    );
    assert.ok(
      catalog.every(
        ({ search, label }) =>
          search.includes(label) && !search.includes("ui."),
      ),
    );
    const html = renderPersonForm(state.project.people[0], [], "p1");
    for (const { key } of catalog) {
      assert.ok(html.includes(`data-profile-panel="${key}"`));
      assert.ok(html.includes(`data-profile-target="${key}"`));
    }
    assert.ok(!html.includes("profile-additional-sections"));
  }
  setLanguage("en");
  assert.equal(
    profileSectionCount({ biography: "Life story" }, "biography"),
    1,
  );
  assert.equal(profileSectionCount({}, "education"), 0);
});

test("history publishes project changes without a DOM and repairs removed profile focus", () => {
  state.project = sample();
  state.history = [];
  state.future = [];
  state.selected = null;
  state.profileFocus = "missing";
  const original = state.project.title;
  let changes = 0;
  const unsubscribe = onSignal("project:changed", () => changes++);
  commit(() => {
    state.project.title = "Updated";
  });
  undo();
  assert.equal(state.project.title, original);
  assert.equal(state.profileFocus, "");
  redo();
  assert.equal(state.project.title, "Updated");
  assert.equal(changes, 3);
  unsubscribe();
});
