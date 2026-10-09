import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { familyConnection } from "../src/core/relationships.js";
import { sample } from "../src/data/demo.js";
import { graphRole } from "../src/graph/roles.js";
import { setLanguage } from "../src/i18n/index.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { profileReferenceLabel } from "../src/model/profile-references.js";
import {
  relationshipLabel,
  roleLabel,
} from "../src/model/relationship-labels.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";

test("divorce labels are consistent across languages while former spouses remain outside current kinship", () => {
  state.project = sample();
  state.project.people = [
    { id: "husband", name: "Alex Doe", gender: "m" },
    { id: "wife", name: "Morgan Roe", gender: "f" },
    { id: "mother", name: "Taylor Roe", gender: "f" },
  ];
  const divorced = {
    id: "former",
    from: "husband",
    to: "wife",
    type: "spouse",
    unionKind: "marriage",
    status: "divorced",
    verification: "confirmed",
    fromDate: "1990",
    toDate: "2000",
  };
  state.project.relations = [
    divorced,
    { id: "parent", from: "mother", to: "wife", type: "parent" },
  ];
  for (const [language, status, wife, husband] of [
    ["en", "Divorced", "Former wife", "Former husband"],
    ["uk", "Розлучені", "Колишня дружина", "Колишній чоловік"],
    ["ru", "Разведены", "Бывшая жена", "Бывший муж"],
  ]) {
    setLanguage(language);
    assert.equal(relationshipLabel(divorced), status);
    assert.equal(roleLabel(divorced, "husband"), wife);
    assert.equal(roleLabel(divorced, "wife"), husband);
    state.selected = { kind: "person", id: "husband" };
    assert.equal(graphRole("wife").label, wife);
    assert.equal(graphRole("mother"), null);
    assert.equal(familyConnection(divorced), false);
    assert.equal(kinshipBetween("husband", "wife").found, false);
    assert.ok(
      profileReferenceLabel(state.project, "relationship", "former").includes(
        status,
      ),
    );
    const results = searchIndex(
      buildSearchIndex(state.project),
      `type:relation ${status}`,
    );
    assert.ok(results.some((r) => r.id === "former" && r.subtitle === status));
  }
  setLanguage("en");
  state.project.relations.push({
    ...divorced,
    id: "remarried",
    fromDate: "2020",
    toDate: "",
    status: "current",
  });
  state.project.updatedAt = "remarried";
  assert.equal(graphRole("wife").label, "Wife");
  assert.equal(
    relationshipLabel(state.project.relations.at(-1)),
    "Registered marriage",
  );
  assert.equal(relationshipLabel(divorced), "Divorced");
});

test("an end date does not invent a divorce and unverified former links do not establish a personal role", () => {
  setLanguage("en");
  state.project = sample();
  const r = state.project.relations.find((r) => r.status === "divorced");
  state.selected = { kind: "person", id: r.from };
  state.project.relations = [{ ...r, verification: "unverified" }];
  assert.equal(graphRole(r.to), null);
  assert.equal(
    relationshipLabel({ ...r, status: "unspecified" }),
    "Registered marriage",
  );
  assert.equal(
    relationshipLabel({ ...r, status: "ended" }),
    "Registered marriage · Ended",
  );
});
