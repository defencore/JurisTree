import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/** Give each complete module graph its own URL, including relative CSS imports and vendor files. */
export async function buildSite(root = ".", output = "dist") {
  root = resolve(root);
  output = resolve(output);
  const hash = createHash("sha256");
  async function fingerprint(path) {
    const entries = await readdir(join(root, path), { withFileTypes: true });
    for (const entry of entries.sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    )) {
      const file = path + "/" + entry.name;
      if (entry.isDirectory()) await fingerprint(file);
      else {
        hash.update(file + "\0");
        hash.update(await readFile(join(root, file)));
        hash.update("\0");
      }
    }
  }
  const html = await readFile(join(root, "index.html"), "utf8");
  hash.update(html);
  await fingerprint("src");
  await fingerprint("public");
  const assetBase = "assets/" + hash.digest("hex").slice(0, 16);
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, assetBase), { recursive: true });
  for (const entry of ["src", "public"])
    await cp(join(root, entry), join(output, assetBase, entry), {
      recursive: true,
    });
  await writeFile(
    join(output, "index.html"),
    html
      .replaceAll('"./src/', '"./' + assetBase + "/src/")
      .replaceAll('"./public/', '"./' + assetBase + "/public/"),
  );
  await cp(
    join(root, "THIRD_PARTY_NOTICES.md"),
    join(output, "THIRD_PARTY_NOTICES.md"),
  );
  if (existsSync(join(root, "CNAME")))
    await cp(join(root, "CNAME"), join(output, "CNAME"));
  await writeFile(join(output, ".nojekyll"), "");
  return assetBase;
}
