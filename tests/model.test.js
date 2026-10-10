import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { fresh } from "../src/model/project.js";
import { validateImport } from "../src/model/validation.js";
import { dateExact, partialDate, nextAnniversary } from "../src/model/dates.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { cousinName } from "../src/model/kinship-labels.js";
import { edgeState } from "../src/model/evidence.js";
import { familyLayout } from "../src/graph/layouts/family.js";
import {
  findGraphPaths,
  findConnectingNetwork,
} from "../src/model/graph-analysis.js";
import { catalogs, setLanguage, translate } from "../src/i18n/index.js";

function project() {
  state.project = sample();
  return state.project;
}

test("new projects contain no demo records", () => {
  const model = fresh();
  assert.equal(model.format, "juristree");
  assert.equal(model.demo, false);
  assert.deepEqual(model.people, []);
});

test("all language catalogs have the same complete keys", () => {
  const keys = Object.keys(catalogs.en).sort();
  for (const locale of ["en", "uk", "ru"]) {
    assert.deepEqual(Object.keys(catalogs[locale]).sort(), keys);
    assert.ok(
      Object.values(catalogs[locale]).every(
        (value) => typeof value === "string" && value.length,
      ),
    );
  }
  setLanguage("en");
  assert.throws(() => translate("missing.message"));
  assert.throws(() => setLanguage("xx"));
});

test("demo data round-trips through the validated archive model", () => {
  const model = validateImport(JSON.parse(JSON.stringify(project())));
  assert.equal(model.people.length, 99);
  assert.equal(model.relations.length, 163);
  assert.equal(model.documents.length, 102);
});

test("group colors and collapse positions survive reload while invalid CSS colors are removed", () => {
  const original = project();
  original.groups[0].collapsed = true;
  original.groups[0].x = 320;
  original.groups[0].y = 240;
  const restored = validateImport(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(restored.groups, original.groups);
  original.groups[0].color = 'red" onclick="alert(1)';
  assert.match(validateImport(original).groups[0].color, /^#[0-9a-f]{6}$/i);
});

test("rejects duplicate identifiers and unsupported schemas", () => {
  const model = project();
  model.people[1].id = model.people[0].id;
  assert.throws(() => validateImport(model));
  assert.throws(() => validateImport({ format: "other", version: 1 }));
});

test("rejects generation cycles and self relationships", () => {
  const model = project();
  model.relations.push({ id: "cycle", from: "p5", to: "p1", type: "parent" });
  assert.throws(() => validateImport(model));
  model.relations.pop();
  model.relations[0].to = model.relations[0].from;
  assert.throws(() => validateImport(model));
});

test("rejects unsafe source URLs and invalid property allocation", () => {
  const model = project();
  model.documents[0].sourceUrl = "javascript:alert(1)";
  assert.throws(() => validateImport(model));
  model.documents[0].sourceUrl = "";
  model.property.push({
    id: "asset1",
    title: "House",
    value: 100,
    allocations: [
      { personId: "p1", percent: 70 },
      { personId: "p2", percent: 40 },
    ],
  });
  assert.throws(() => validateImport(model));
});

test("validates real calendar dates and partial years", () => {
  assert.equal(dateExact("2024-02-29"), "2024-02-29");
  assert.equal(dateExact("2023-02-29"), "");
  assert.equal(dateExact("2024-04-31"), "");
  assert.equal(dateExact("0099-01-01"), "0099-01-01");
  assert.equal(partialDate("1932").max, "1932-12-31");
  assert.equal(partialDate("unknown"), null);
});

test("maps leap-day anniversaries to February 28 in common years", () => {
  const anniversary = nextAnniversary("2000-02-29", "2025-02-01");
  assert.equal(anniversary.date, "2025-02-28");
});

test("derives ancestors, siblings and cousin degree from connections", () => {
  project();
  setLanguage("en");
  assert.equal(kinshipBetween("p5", "p1").kind, "ancestor");
  assert.equal(kinshipBetween("p5", "p6").kind, "sibling");
  assert.equal(cousinName(1, { gender: "f" }), "First cousin");
});

test("does not treat acquaintance as confirmed kinship", () => {
  const model = project();
  model.relations = model.relations.filter((relation) => relation.id === "r9");
  const result = kinshipBetween("p4", "p7");
  assert.equal(result.found, false);
  assert.equal(result.kind, "acquaintance");
});

test("keeps document availability separate from evidence quality", () => {
  const model = project();
  assert.equal(
    edgeState(model.relations.find((r) => r.id === "r5")),
    "official",
  );
  assert.equal(
    edgeState(model.relations.find((r) => r.id === "r9")),
    "indirect",
  );
  assert.equal(edgeState(model.relations.find((r) => r.id === "r2")), "review");
});

test("finds graph paths and a connecting network", () => {
  project();
  const options = { scope: "all", maxDepth: 8 };
  const path = findGraphPaths("p1", "p5", options);
  assert.ok(path.paths.length);
  assert.ok(path.paths[0].people.includes("p1"));
  const network = findConnectingNetwork(["p1", "p5", "p8"], options);
  assert.ok(network.people.includes("p8"));
});

test("generation layout includes finite positions for every record", () => {
  const model = project();
  const result = familyLayout(model);
  for (const p of model.people) {
    const position = result.people.get(p.id);
    assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y));
  }
  assert.equal(result.documents.size, model.documents.length);
});

test("all interface message references exist in the catalogs", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  async function inspect(directory) {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      const url = new URL(
        file.name + (file.isDirectory() ? "/" : ""),
        directory,
      );
      if (file.isDirectory()) {
        if (!["vendor", "locales"].includes(file.name)) await inspect(url);
      } else if (file.name.endsWith(".js")) {
        for (const [key] of (await readFile(url, "utf8")).matchAll(
          /ui\.[A-Za-z0-9]+/g,
        )) {
          assert.ok(
            Object.hasOwn(catalogs.en, key),
            `Missing interface message: ${key}`,
          );
        }
      }
    }
  }
  await inspect(new URL("../src/", import.meta.url));
});

test("year labels follow each language plural rules", async () => {
  const { yearWord } = await import("../src/model/dates.js");
  setLanguage("en");
  assert.equal(yearWord(1), "year");
  assert.equal(yearWord(21), "years");
  setLanguage("uk");
  assert.equal(yearWord(21), "рік");
  setLanguage("ru");
  assert.equal(yearWord(22), "года");
  setLanguage("en");
});
