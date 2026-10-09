import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesPersonName,
  orderedPeople,
  personNameIndex,
  personSurname,
} from "../src/model/person-selection.js";

test("surname ordering handles compound and surname-first recorded names without using maiden surnames", () => {
  const people = [
    {
      id: "z",
      name: "Alex Ward",
      nameHistory: [
        {
          kind: "maiden",
          fullName: "Alex Adams",
          surname: "Adams",
          to: "2000",
        },
      ],
    },
    {
      id: "d",
      name: "Anna van Dijk",
      nameHistory: [
        { kind: "legal", fullName: "Anna van Dijk", surname: "van Dijk" },
      ],
    },
    {
      id: "a",
      name: "Adams John Paul",
      nameHistory: [
        {
          kind: "legal",
          fullName: "Adams John Paul",
          surname: "Adams",
          givenName: "John",
          patronymic: "Paul",
        },
      ],
    },
    { id: "w", name: "Morgan Ward" },
    { id: "c", name: "Cher" },
  ];
  const original = structuredClone(people);
  assert.deepEqual(
    orderedPeople(people, "en").map((p) => p.id),
    ["a", "c", "d", "z", "w"],
  );
  assert.equal(personSurname(people[0]), "Ward");
  assert.equal(
    personSurname({
      name: "Anna van Dijk",
      nameHistory: [{ kind: "legal", surname: "van Dijk" }],
    }),
    "van Dijk",
  );
  assert.deepEqual(people, original);
});

test("alphabetical order follows the chosen language, with full names and stable IDs breaking ties", () => {
  const people = [
    { id: "3", name: "Олег Їжак" },
    { id: "2", name: "Олена Ілько" },
    { id: "1", name: "Іван Єрко" },
    { id: "6", name: "Alex Doe" },
    { id: "5", name: "Alex Doe" },
    { id: "4", name: "Casey Doe" },
  ];
  assert.deepEqual(
    orderedPeople(people.slice(0, 3), "uk").map((p) => p.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    orderedPeople(people.slice(3), "en").map((p) => p.id),
    ["5", "6", "4"],
  );
});

test("name search matches partial words, aliases and former names in any token order", () => {
  const index = personNameIndex({
    name: "Casey Roe",
    aliases: "K. Roe",
    nameHistory: [
      { fullName: "Casey Ward", surname: "Ward", givenName: "Catherine" },
    ],
  });
  for (const query of ["", "  ", "ward CASE", "Roe Catherine", "k.", "Cäsey"])
    assert.ok(matchesPersonName(index, query), query);
  for (const query of ["Ward Jamie", "Blake", "John"])
    assert.equal(matchesPersonName(index, query), false, query);
  const ukrainian = personNameIndex({ name: "Марія Лук’яненко" });
  assert.ok(matchesPersonName(ukrainian, "лук'я МАР"));
});
