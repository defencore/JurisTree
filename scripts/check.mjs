import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await check(path);
    else if (/\.(js|mjs)$/.test(path)) {
      const result = spawnSync(process.execPath, ["--check", path], {
        encoding: "utf8",
      });
      if (result.status) {
        process.stderr.write(result.stderr);
        process.exitCode = 1;
      }
    }
  }
}
await check("src");
await check("scripts");
