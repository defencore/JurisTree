import { catalogs } from "../../i18n/index.js";

const terminology = new Map();
for (const key of Object.keys(catalogs.en)) {
  const values = Object.values(catalogs).map((catalog) => catalog[key]);
  for (const value of values) terminology.set(value, values.join(" "));
}

/** Search includes equivalent registry labels in all supported languages. */
export const terminologyLabel = (value) => terminology.get(value) || value;
