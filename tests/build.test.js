import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  stat,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSite } from "../scripts/lib/static-site.mjs";

test("static build gives the complete module graph deterministic content URLs and preserves subdirectory imports", async () => {
  const root = await mkdtemp(join(tmpdir(), "juristree-build-"));
  try {
    await mkdir(join(root, "src/styles"), { recursive: true });
    await mkdir(join(root, "public"));
    await writeFile(
      join(root, "index.html"),
      '<link href="./public/favicon.svg"><link href="./src/styles/index.css"><script type="module" src="./src/main.js"></script>',
    );
    await writeFile(join(root, "src/main.js"), 'import "./feature.js";');
    await writeFile(join(root, "src/feature.js"), "export const value = 1;");
    await writeFile(
      join(root, "src/styles/index.css"),
      '@import "./feature.css";',
    );
    await writeFile(
      join(root, "src/styles/feature.css"),
      "body { color: #111; }",
    );
    await writeFile(join(root, "public/favicon.svg"), "<svg/>");
    await writeFile(
      join(root, "THIRD_PARTY_NOTICES.md"),
      "Third party notices",
    );
    await writeFile(join(root, "CNAME"), "example.test");
    const output = join(root, "dist");
    const first = await buildSite(root, output);
    const html = await readFile(join(output, "index.html"), "utf8");
    const base = new URL("https://example.test/project/");
    const entry = new URL(html.match(/src="([^"]+)"/)[1], base);
    assert.equal(entry.pathname, "/project/" + first + "/src/main.js");
    assert.ok((await stat(join(output, first, "src/feature.js"))).isFile());
    assert.equal(
      await readFile(join(output, first, "src/styles/index.css"), "utf8"),
      '@import "./feature.css";',
    );
    assert.equal(await readFile(join(output, "CNAME"), "utf8"), "example.test");
    assert.ok((await stat(join(output, ".nojekyll"))).isFile());
    assert.equal(await buildSite(root, output), first);
    await writeFile(join(root, "src/feature.js"), "export const value = 2;");
    assert.notEqual(await buildSite(root, output), first);
    assert.ok(
      !(await readFile(join(output, "index.html"), "utf8")).includes(first),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
