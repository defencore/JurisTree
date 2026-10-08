import { buildSite } from "./lib/static-site.mjs";

const assets = await buildSite();
console.log(`Static JurisTree site built in dist/ (${assets}).`);
