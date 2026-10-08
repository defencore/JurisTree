import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { graphView, relationShown } from "./analysis.js";
import { fit } from "./camera.js";
import { renderGraphControls } from "./controls.js";
import { filteredGraphNodes } from "./render.js";
import { translate } from "../i18n/index.js";
import { group, person, withProjectIndex } from "../model/project.js";
import { commit } from "../services/history.js";
import { toast } from "../ui/dialog.js";
export function familyLayout(tree) {
  const ids = new Set(tree.people.map((p) => p.id)),
    order = new Map(tree.people.map((p, i) => [p.id, i])),
    dsu = new Map([...ids].map((id) => [id, id]));
  const find = (id) => {
    let root = id;
    while (dsu.get(root) !== root) root = dsu.get(root);
    while (id !== root) {
      const next = dsu.get(id);
      dsu.set(id, root);
      id = next;
    }
    return root;
  };
  const parents = tree.relations.filter(
    (r) =>
      ["parent", "adopted"].includes(r.type) &&
      ids.has(r.from) &&
      ids.has(r.to),
  );
  const peers = tree.relations.filter(
    (r) =>
      ["spouse", "sibling"].includes(r.type) &&
      ids.has(r.from) &&
      ids.has(r.to),
  );
  const parentGraph = () => {
    const graph = new Map();
    for (const r of parents) {
      const from = find(r.from),
        to = find(r.to);
      if (from !== to) {
        if (!graph.has(from)) graph.set(from, new Set());
        graph.get(from).add(to);
      }
    }
    return graph;
  };
  const reachable = (graph, from, to) => {
    const pending = [from],
      seen = new Set();
    while (pending.length) {
      const id = pending.pop();
      if (id === to) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const next of graph.get(id) || []) pending.push(next);
    }
    return false;
  };
  for (const r of peers) {
    const from = find(r.from),
      to = find(r.to);
    if (from === to) continue;
    const graph = parentGraph();
    if (!reachable(graph, from, to) && !reachable(graph, to, from))
      dsu.set(to, from);
  }
  const units = new Map();
  for (const p of tree.people) {
    const id = find(p.id);
    if (!units.has(id))
      units.set(id, {
        id,
        members: [],
        parents: new Set(),
        children: new Set(),
        neighbors: new Set(),
        level: 0,
      });
    units.get(id).members.push(p);
  }
  for (const r of parents) {
    const a = units.get(find(r.from)),
      b = units.get(find(r.to));
    if (a !== b) {
      a.children.add(b.id);
      b.parents.add(a.id);
      a.neighbors.add(b.id);
      b.neighbors.add(a.id);
    }
  }
  for (const r of peers) {
    const a = units.get(find(r.from)),
      b = units.get(find(r.to));
    if (a !== b) {
      a.neighbors.add(b.id);
      b.neighbors.add(a.id);
    }
  }
  const indegree = new Map([...units].map(([id, u]) => [id, u.parents.size])),
    pending = [...units.keys()].filter((id) => !indegree.get(id));
  for (let i = 0; i < pending.length; i++) {
    const u = units.get(pending[i]);
    for (const id of u.children) {
      const child = units.get(id);
      child.level = Math.max(child.level, u.level + 1);
      indegree.set(id, indegree.get(id) - 1);
      if (!indegree.get(id)) pending.push(id);
    }
  }
  if (pending.length !== units.size)
    throw Error(
      translate("ui.couldNotArrangeGenerationsCheckParentRelationships"),
    );
  for (const id of [...pending].reverse()) {
    const u = units.get(id);
    if (u.children.size)
      u.level = Math.max(
        u.level,
        Math.min(...[...u.children].map((child) => units.get(child).level)) - 1,
      );
  }
  const groupOrder = new Map((tree.groups || []).map((g, i) => [g.id, i])),
    groupRank = (p) => groupOrder.get(p.groupIds?.[0]) ?? groupOrder.size;
  for (const u of units.values())
    u.members.sort(
      (a, b) =>
        groupRank(a) - groupRank(b) || order.get(a.id) - order.get(b.id),
    );
  const components = [],
    visited = new Set();
  for (const root of units.keys()) {
    if (visited.has(root)) continue;
    const stack = [root],
      component = [];
    while (stack.length) {
      const id = stack.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      const u = units.get(id);
      component.push(u);
      for (const next of u.neighbors) stack.push(next);
    }
    components.push(component);
  }
  const firstOrder = (c) =>
    Math.min(...c.flatMap((u) => u.members.map((p) => order.get(p.id))));
  const firstGroup = (c) =>
    Math.min(...c.flatMap((u) => u.members.map(groupRank)));
  components.sort(
    (a, b) => firstGroup(a) - firstGroup(b) || firstOrder(a) - firstOrder(b),
  );
  const positions = new Map(),
    levels = new Map(),
    targetWidth = Math.max(
      1180,
      Math.min(4200, Math.sqrt(Math.max(1, tree.people.length)) * 310),
    );
  let shelfX = 55,
    shelfY = 70,
    shelfHeight = 0;
  for (const component of components) {
    const rows = new Map(),
      firstLevel = Math.min(...component.map((u) => u.level));
    for (const u of component) {
      const level = u.level - firstLevel;
      if (!rows.has(level)) rows.set(level, []);
      rows.get(level).push(u);
    }
    for (const row of rows.values())
      row.sort(
        (a, b) =>
          Math.min(...a.members.map(groupRank)) -
            Math.min(...b.members.map(groupRank)) ||
          order.get(a.members[0].id) - order.get(b.members[0].id),
      );
    const centers = new Map();
    const updateCenters = () => {
      for (const row of rows.values()) {
        let x = 0;
        for (const u of row) {
          const width = u.members.length * 310;
          centers.set(u.id, x + width / 2);
          x += width;
        }
      }
    };
    updateCenters();
    const rowLevels = [...rows.keys()].sort((a, b) => a - b);
    for (let sweep = 0; sweep < 6; sweep++)
      for (const level of sweep % 2 ? [...rowLevels].reverse() : rowLevels) {
        const row = rows.get(level),
          original = new Map(row.map((u, i) => [u.id, i]));
        const score = (u) => {
          const ns = [...(sweep % 2 ? u.children : u.parents)]
            .map((id) => centers.get(id))
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
          return ns.length
            ? (ns[Math.floor((ns.length - 1) / 2)] +
                ns[Math.floor(ns.length / 2)]) /
                2
            : centers.get(u.id);
        };
        const scores = new Map(row.map((u) => [u.id, score(u)]));
        row.sort(
          (a, b) =>
            scores.get(a.id) - scores.get(b.id) ||
            original.get(a.id) - original.get(b.id),
        );
        updateCenters();
      }
    const width =
        Math.max(
          ...[...rows.values()].map((row) =>
            row.reduce((sum, u) => sum + u.members.length * 310, 0),
          ),
        ) - 60,
      height = (Math.max(...rows.keys()) + 1) * 230 - 72;
    if (shelfX > 55 && shelfX + width > targetWidth) {
      shelfX = 55;
      shelfY += shelfHeight + 100;
      shelfHeight = 0;
    }
    for (const [level, row] of rows) {
      let x =
        shelfX +
        (width -
          (row.reduce((sum, u) => sum + u.members.length * 310, 0) - 60)) /
          2;
      for (const u of row)
        for (const p of u.members) {
          positions.set(p.id, {
            x,
            y: shelfY + level * 230,
          });
          levels.set(p.id, u.level);
          x += 310;
        }
    }
    shelfX += width + 110;
    shelfHeight = Math.max(shelfHeight, height);
  }
  const right = Math.max(
      1150,
      ...[...positions.values()].map((p) => p.x + 250),
    ),
    bottom = Math.max(0, ...[...positions.values()].map((p) => p.y + 158)),
    columns = Math.max(1, Math.floor((right - 55) / 265)),
    sources = new Map(),
    property = new Map();
  (tree.documents || []).forEach((d, i) =>
    sources.set(d.id, {
      x: 55 + (i % columns) * 265,
      y: bottom + 100 + Math.floor(i / columns) * 170,
    }),
  );
  const propertyTop =
    bottom +
    100 +
    (Math.ceil((tree.documents || []).length / columns) || 0) * 170;
  (tree.property || []).forEach((a, i) =>
    property.set(a.id, {
      x: 55 + (i % columns) * 265,
      y: propertyTop + Math.floor(i / columns) * 170,
    }),
  );
  return {
    people: positions,
    documents: sources,
    property,
    levels,
  };
}
export function avoidNodeOverlap(nodes, positions) {
  const placed = [];
  for (const node of nodes) {
    const p = positions.get(node.id);
    let attempts = 0;
    while (attempts++ < nodes.length + 2) {
      const collision = placed.find(
        (n) =>
          Math.abs(p.x - n.x) < (node.w + n.w) / 2 + 36 &&
          Math.abs(p.y - n.y) < (node.h + n.h) / 2 + 34,
      );
      if (!collision) break;
      p.y = collision.y + (node.h + collision.h) / 2 + 35;
    }
    placed.push({
      ...node,
      x: p.x,
      y: p.y,
    });
  }
  const minX = Math.min(...[...positions.values()].map((p) => p.x)),
    minY = Math.min(...[...positions.values()].map((p) => p.y));
  for (const [, p] of positions) {
    p.x = p.x - minX + 55;
    p.y = p.y - minY + 70;
    p.x = Math.round(p.x);
    p.y = Math.round(p.y);
  }
  return positions;
}
export function circularLayout(nodes) {
  const result = new Map();
  if (!nodes.length) return result;
  let index = 0,
    radius = 0;
  while (index < nodes.length) {
    const count = radius
      ? Math.min(nodes.length - index, Math.floor((2 * Math.PI * radius) / 330))
      : 1;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      result.set(nodes[index++].id, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    radius = radius ? radius + 350 : 480;
  }
  return avoidNodeOverlap(nodes, result);
}
export async function networkLayout(nodes, relations) {
  if (nodes.length < 3) return circularLayout(nodes);
  const map = new Map(nodes.map((n, i) => [n.id, i]));
  nodes
    .filter((n) => n.kind === "group")
    .forEach((n) => n.members.forEach((id) => map.set(id, map.get(n.id))));
  const links = relations
      .map((r) => [map.get(r.from), map.get(r.to)])
      .filter(([a, b]) => a !== undefined && b !== undefined && a !== b),
    n = nodes.length,
    k = 340,
    radius = Math.max(500, Math.sqrt(n) * 170),
    points = nodes.map((_, i) => ({
      x: radius * Math.cos((i * 2 * Math.PI) / n),
      y: radius * Math.sin((i * 2 * Math.PI) / n),
    })),
    iterations = n > 180 ? 100 : 160;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const forces = points.map(() => ({
      x: 0,
      y: 0,
    }));
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        let dx = points[i].x - points[j].x,
          dy = points[i].y - points[j].y;
        const d = Math.max(1, Math.hypot(dx, dy)),
          f = (k * k) / (d * d);
        forces[i].x += dx * f;
        forces[i].y += dy * f;
        forces[j].x -= dx * f;
        forces[j].y -= dy * f;
      }
    for (const [i, j] of links) {
      const dx = points[j].x - points[i].x,
        dy = points[j].y - points[i].y,
        d = Math.max(1, Math.hypot(dx, dy)),
        f = (d / k) * 0.35;
      forces[i].x += dx * f;
      forces[i].y += dy * f;
      forces[j].x -= dx * f;
      forces[j].y -= dy * f;
    }
    const temperature = 80 * (1 - iteration / iterations) + 3;
    for (let i = 0; i < n; i++) {
      const f = forces[i],
        d = Math.max(1, Math.hypot(f.x, f.y)),
        scale = Math.min(temperature, d) / d;
      points[i].x += f.x * scale;
      points[i].y += f.y * scale;
    }
    if (iteration % 8 === 0)
      await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return avoidNodeOverlap(
    nodes,
    new Map(
      nodes.map((node, i) => [
        node.id,
        {
          ...points[i],
        },
      ]),
    ),
  );
}
export async function arrangeGraph(style = graphView().layout) {
  if (appState.analysisBusy) return;
  const start = appState.project,
    updatedAt = appState.project.updatedAt,
    scopeKey =
      appState.groupFilter +
      "|" +
      JSON.stringify(appState.graphFocus?.people || []),
    cfg = graphView();
  appState.analysisBusy = true;
  renderGraphControls();
  try {
    let positions;
    if (style === "generations") positions = familyLayout(appState.project);
    else {
      const nodes = filteredGraphNodes().filter((n) =>
        ["person", "group"].includes(n.kind),
      );
      if (!nodes.length) {
        toast(translate("ui.noPeopleToArrange"));
        return;
      }
      const rs = withProjectIndex(() =>
        appState.project.relations.filter((r) => relationShown(r)),
      );
      const ps =
        style === "circle"
          ? circularLayout(nodes)
          : await networkLayout(nodes, rs);
      positions = {
        people: ps,
        documents: new Map(),
        property: new Map(),
      };
    }
    if (
      appState.project !== start ||
      appState.project.updatedAt !== updatedAt ||
      appState.groupFilter +
        "|" +
        JSON.stringify(appState.graphFocus?.people || []) !==
        scopeKey
    ) {
      toast(translate("ui.treeChangedDuringLayoutTryAgain"));
      return;
    }
    commit(() => {
      appState.project.graphView = {
        ...cfg,
        layout: style,
      };
      for (const [id, pos] of positions.people) {
        const p = person(id);
        if (p) Object.assign(p, pos);
        else {
          const g = group(id);
          if (g) {
            const members = appState.project.people.filter((p) =>
                (p.groupIds || []).includes(id),
              ),
              dx =
                pos.x -
                (Number.isFinite(g.x)
                  ? g.x
                  : Math.min(...members.map((p) => p.x))),
              dy =
                pos.y -
                (Number.isFinite(g.y)
                  ? g.y
                  : Math.min(...members.map((p) => p.y)));
            members.forEach((p) => {
              p.x += dx;
              p.y += dy;
            });
            Object.assign(g, pos);
          }
        }
      }
      if (style === "generations") {
        appState.project.groups.forEach((g) => {
          g.x = null;
          g.y = null;
        });
        appState.project.documents.forEach((d) =>
          Object.assign(d, positions.documents.get(d.id)),
        );
        appState.project.property.forEach((a) =>
          Object.assign(a, positions.property.get(a.id)),
        );
      } else {
        const right = Math.max(
            1100,
            ...appState.project.people.map((p) => p.x + PERSON_CARD_WIDTH),
          ),
          bottom = Math.max(
            0,
            ...appState.project.people.map((p) => p.y + PERSON_CARD_HEIGHT),
          ),
          cols = Math.max(1, Math.min(20, Math.floor(right / 265)));
        appState.project.documents.forEach((d, i) =>
          Object.assign(d, {
            x: 55 + (i % cols) * 265,
            y: bottom + 100 + Math.floor(i / cols) * 170,
          }),
        );
        appState.project.property.forEach((a, i) =>
          Object.assign(a, {
            x: 55 + (i % cols) * 265,
            y:
              bottom +
              100 +
              Math.ceil(appState.project.documents.length / cols) * 170 +
              Math.floor(i / cols) * 170,
          }),
        );
      }
    });
    fit();
  } catch (error) {
    toast(error.message, true);
  } finally {
    appState.analysisBusy = false;
    renderGraphControls();
  }
}
