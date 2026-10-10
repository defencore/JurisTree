import { graphStateInfo, relTypes } from "./config.js";
import { layoutTypes } from "./layouts.js";

export function defaultGraphView() {
  return {
    types: Object.keys(relTypes()),
    states: Object.keys(graphStateInfo()),
    hiddenRelations: [],
    showLabels: true,
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
    showIsolated: true,
    documentLinks: true,
    propertyLinks: true,
    lineStyle: "curve",
    layout: "generations",
  };
}
export function normalizeGraphView(raw = {}, validIds = null) {
  const out = defaultGraphView();
  for (const key of ["types", "states"])
    if (Array.isArray(raw[key]))
      out[key] = [
        ...new Set(
          raw[key].filter(
            (v) =>
              typeof v === "string" &&
              Object.hasOwn(key === "types" ? relTypes() : graphStateInfo(), v),
          ),
        ),
      ];
  if (Array.isArray(raw.hiddenRelations))
    out.hiddenRelations = [
      ...new Set(
        raw.hiddenRelations.filter(
          (v) =>
            typeof v === "string" &&
            /^[\w-]{1,100}$/.test(v) &&
            (!validIds || validIds.has(v)),
        ),
      ),
    ].slice(0, 2500);
  for (const key of [
    "showLabels",
    "showGrid",
    "snapToGrid",
    "showIsolated",
    "documentLinks",
    "propertyLinks",
  ])
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  if (["straight", "curve"].includes(raw.lineStyle))
    out.lineStyle = raw.lineStyle;
  if (Object.hasOwn(layoutTypes, raw.layout)) out.layout = raw.layout;
  if (
    Number.isInteger(raw.gridSize) &&
    raw.gridSize >= 5 &&
    raw.gridSize <= 200
  )
    out.gridSize = raw.gridSize;
  return out;
}
