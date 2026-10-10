import { layoutTypes } from "../../core/layouts.js";
import { familyLayout } from "./family.js";
import { hierarchyLayout, multipleCircles, singleCircle } from "./shapes.js";
import { networkLayout } from "./forces.js";

export async function computeLayout(input, style, rootKey, yieldFrame) {
  if (!Object.hasOwn(layoutTypes, style)) throw Error("Unknown layout method");
  const { nodes, links } = input;
  if (!nodes.length) return new Map();
  if (style === "circle") return singleCircle(nodes);
  if (style === "circles") return multipleCircles(nodes, links);
  if (["hierarchy", "orthogonal"].includes(style))
    return hierarchyLayout(nodes, links, rootKey);
  if (["network", "incremental"].includes(style))
    return networkLayout(nodes, links, {
      incremental: style === "incremental",
      yieldFrame,
    });
  const family = nodes.filter((node) =>
      ["person", "group"].includes(node.kind),
    ),
    other = nodes.filter((node) => !["person", "group"].includes(node.kind));
  const positions = familyLayout({
    people: family.map((node) => ({ ...node, id: node.key })),
    relations: links.filter((link) => link.type).map((link) => ({ ...link })),
    groups: [],
    documents: [],
    property: [],
  }).people;
  const bottom = Math.max(
      0,
      ...family.map((node) => positions.get(node.key).y + node.h),
    ),
    columns = Math.max(1, Math.ceil(Math.sqrt(other.length))),
    width = Math.max(280, ...other.map((node) => node.w)) + 60,
    height = Math.max(128, ...other.map((node) => node.h)) + 60;
  other.forEach((node, index) =>
    positions.set(node.key, {
      x: (index % columns) * width,
      y: bottom + 100 + Math.floor(index / columns) * height,
    }),
  );
  return positions;
}
