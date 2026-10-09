import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "espree";

const root = fileURLToPath(new URL("../src/", import.meta.url));
async function modules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries
        .filter((entry) => entry.name !== "vendor")
        .map(async (entry) => {
          const file = path.join(directory, entry.name);
          return entry.isDirectory()
            ? modules(file)
            : file.endsWith(".js")
              ? [file]
              : [];
        }),
    )
  ).flat();
}

test("module dependencies are acyclic and data, storage and UI do not depend on feature controllers", async () => {
  const graph = new Map();
  for (const file of await modules(root)) {
    const ast = parse(await readFile(file, "utf8"), {
      ecmaVersion: "latest",
      sourceType: "module",
    });
    const imports = ast.body
      .filter(
        (node) =>
          node.type === "ImportDeclaration" &&
          node.source.value.startsWith("."),
      )
      .map((node) => path.resolve(path.dirname(file), node.source.value));
    graph.set(
      file,
      imports.filter(
        (dependency) => !dependency.includes(`${path.sep}vendor${path.sep}`),
      ),
    );
    const layer = path.relative(root, file).split(path.sep)[0];
    for (const dependency of imports) {
      const target = path.relative(root, dependency).split(path.sep)[0];
      if (["core", "model", "services", "ui"].includes(layer))
        assert.notEqual(
          target,
          "features",
          `${path.relative(root, file)} imports a feature controller`,
        );
      if (["core", "model", "services"].includes(layer))
        assert.ok(
          !["app", "ui", "graph"].includes(target),
          `${path.relative(root, file)} depends on presentation or application effects`,
        );
    }
  }
  const visited = new Set(),
    active = new Set(),
    stack = [];
  function visit(file) {
    assert.ok(
      !active.has(file),
      `Circular import: ${[...stack, file].map((file) => path.relative(root, file)).join(" → ")}`,
    );
    if (visited.has(file)) return;
    assert.ok(graph.has(file), `Missing module: ${file}`);
    active.add(file);
    stack.push(file);
    for (const dependency of graph.get(file)) visit(dependency);
    stack.pop();
    active.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
});
