import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { graphRole } from "../src/graph/roles.js";
import { setLanguage } from "../src/i18n/index.js";
import { withKinshipIndex } from "../src/model/kinship-index.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { fresh } from "../src/model/project.js";

function family() {
  setLanguage("en");
  state.project = fresh();
  state.selected = { kind: "person", id: "self" };
  state.project.people = Object.entries({
    self: "m",
    mother: "f",
    father: "m",
    grandmother: "f",
    grandfather: "m",
    wife: "f",
    brother: "m",
    sister: "f",
    half: "f",
    other: "f",
    son: "m",
    daughter: "f",
    grandson: "m",
    granddaughter: "f",
    aunt: "f",
    uncle: "m",
    niece: "f",
    nephew: "m",
    cousin: "f",
    motherInLaw: "f",
    stranger: "m",
  }).map(([id, gender]) => ({ id, name: id, gender }));
  const link = (from, to, type = "parent") => ({
    id: `${from}-${to}`,
    from,
    to,
    type,
    verification: "confirmed",
  });
  state.project.relations = [
    ...["mother", "father"].flatMap((parent) =>
      ["self", "brother", "sister"].map((child) => link(parent, child)),
    ),
    ...["grandmother", "grandfather"].flatMap((parent) =>
      ["mother", "aunt", "uncle"].map((child) => link(parent, child)),
    ),
    link("father", "half"),
    link("other", "half"),
    link("self", "wife", "spouse"),
    link("self", "son"),
    link("self", "daughter"),
    link("son", "grandson"),
    link("daughter", "granddaughter"),
    link("brother", "niece"),
    link("sister", "nephew"),
    link("aunt", "cousin"),
    link("motherInLaw", "wife"),
    link("self", "stranger", "professional"),
  ];
}

test("cards describe each relative from the selected person's perspective", () => {
  family();
  const labels = {
    mother: "Mother",
    father: "Father",
    grandmother: "Grandmother",
    grandfather: "Grandfather",
    wife: "Wife",
    brother: "Brother",
    sister: "Sister",
    half: "Half-sister",
    son: "Son",
    daughter: "Daughter",
    grandson: "Grandson",
    granddaughter: "Granddaughter",
    aunt: "Aunt",
    uncle: "Uncle",
    niece: "Niece",
    nephew: "Nephew",
    cousin: "First cousin",
  };
  withKinshipIndex(() => {
    for (const [id, label] of Object.entries(labels))
      assert.equal(graphRole(id)?.label, label, id);
  });
  assert.equal(graphRole("motherInLaw").group, "affinity");
  assert.equal(graphRole("stranger"), null);
  state.selected.id = "wife";
  assert.equal(graphRole("self").label, "Husband");
  state.selected.id = "grandmother";
  assert.equal(graphRole("self").label, "Grandson");
});

test("all five demo cousin degrees and adoption qualifiers follow the interface language", () => {
  state.project = sample();
  state.selected = { kind: "person", id: "p5" };
  for (const [language, labels] of [
    [
      "en",
      [
        "First cousin",
        "Second cousin",
        "Third cousin",
        "Fourth cousin",
        "Fifth cousin",
      ],
    ],
    [
      "uk",
      [
        "Двоюрідна сестра",
        "Троюрідна сестра",
        "Чотириюрідна сестра",
        "П’ятиюрідна сестра",
        "Шестиюрідний брат",
      ],
    ],
    [
      "ru",
      [
        "Двоюродная сестра",
        "Троюродная сестра",
        "Четвероюродная сестра",
        "Пятиюродная сестра",
        "Шестиюродный брат",
      ],
    ],
  ]) {
    setLanguage(language);
    withKinshipIndex(() => {
      for (const [i, id] of [
        "grace",
        "lucy",
        "olivia",
        "emily",
        "nathan",
      ].entries()) {
        assert.equal(graphRole(id).label, labels[i]);
        assert.equal(graphRole(id).group, "collateral");
      }
      assert.equal(graphRole("p6").adopted, true);
      assert.ok(
        graphRole("p6").description.length > graphRole("p6").label.length,
      );
      assert.equal(graphRole("p4").kind, "step_parent");
    });
  }
  setLanguage("en");
  state.selected.id = "p6";
  assert.equal(graphRole("p3").label, "Adoptive parent");
  assert.equal(graphRole("p12").label, "Mother");
  assert.equal(graphRole("p8").label, "Wife");
});

test("unverified, refuted and former links do not establish family roles", () => {
  for (const properties of [
    { type: "parent", verification: "unverified" },
    { type: "parent", verification: "refuted" },
    { type: "spouse", status: "divorced" },
    { type: "partner", status: "ended" },
  ]) {
    family();
    state.project.relations = [
      { id: "link", from: "self", to: "wife", ...properties },
    ];
    assert.equal(graphRole("wife"), null);
  }
  family();
  state.project.relations = [
    {
      id: "link",
      from: "self",
      to: "wife",
      type: "partner",
      unionKind: "dating",
    },
  ];
  assert.equal(graphRole("wife").label, "Dating");
  assert.equal(graphRole("motherInLaw"), null);
  state.project.relations[0] = {
    id: "link",
    from: "wife",
    to: "self",
    type: "adopted",
    verification: "disputed",
  };
  state.project.updatedAt = "changed";
  assert.equal(graphRole("wife").adopted, true);
  assert.equal(graphRole("wife").disputed, true);
});

test("role results refresh after edits, selection, language and undo-style project replacement", () => {
  family();
  assert.equal(graphRole("mother").label, "Mother");
  state.project.people.find((p) => p.id === "mother").gender = "m";
  state.project.updatedAt = "edited";
  assert.equal(graphRole("mother").label, "Father");
  state.selected.id = "son";
  assert.equal(graphRole("mother").label, "Grandfather");
  setLanguage("uk");
  assert.equal(graphRole("mother").label, "Дідусь");
  state.project = { ...state.project, relations: [] };
  assert.equal(graphRole("mother"), null);
  setLanguage("en");
});

test("kinship calculation scopes restore after errors and read fresh relationships on the next run", () => {
  family();
  assert.throws(() =>
    withKinshipIndex(() => {
      assert.equal(kinshipBetween("self", "cousin").degree, 1);
      throw new Error("Stop this calculation");
    }),
  );
  state.project.relations = [];
  assert.equal(kinshipBetween("self", "cousin").found, false);
  state.project.relations.push({
    id: "sibling",
    from: "self",
    to: "cousin",
    type: "sibling",
  });
  assert.equal(kinshipBetween("self", "cousin").kind, "sibling");
});
