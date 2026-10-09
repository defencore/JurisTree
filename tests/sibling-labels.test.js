import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { setLanguage } from "../src/i18n/index.js";
import {
  relationshipLabel,
  roleLabel,
} from "../src/model/relationship-labels.js";

test("sibling captions reflect both recorded genders in relationship order without inventing unspecified genders", () => {
  const previous = state.project;
  try {
    state.project = {
      people: [
        { id: "a", gender: "m" },
        { id: "b", gender: "m" },
      ],
    };
    const relation = { type: "sibling", from: "a", to: "b" };
    for (const [locale, brother, sister, neutral] of [
      ["en", "Brother", "Sister", "Sibling"],
      ["uk", "Брат", "Сестра", "Брат / сестра"],
      ["ru", "Брат", "Сестра", "Брат / сестра"],
    ]) {
      setLanguage(locale);
      for (const [a, b, expected] of [
        ["m", "m", brother],
        ["f", "f", sister],
        ["m", "f", brother + " / " + sister],
        ["f", "m", sister + " / " + brother],
        ["u", "m", neutral],
        ["f", "x", neutral],
        ["u", "u", neutral],
      ]) {
        state.project.people[0].gender = a;
        state.project.people[1].gender = b;
        assert.equal(relationshipLabel(relation), expected);
        assert.equal(
          roleLabel(relation, "a"),
          b === "m" ? brother : b === "f" ? sister : neutral,
        );
        assert.equal(
          roleLabel(relation, "b"),
          a === "m" ? brother : a === "f" ? sister : neutral,
        );
      }
    }
  } finally {
    state.project = previous;
    setLanguage("en");
  }
});
