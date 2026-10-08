import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const entry of ["index.html", "src", "public", "THIRD_PARTY_NOTICES.md"]) {
  await cp(entry, `dist/${entry}`, { recursive: true });
}
if (existsSync("CNAME")) await cp("CNAME", "dist/CNAME");
await writeFile("dist/.nojekyll", "");
console.log("Static JurisTree site built in dist/.");
