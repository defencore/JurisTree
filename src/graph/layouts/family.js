import { PERSON_CARD_WIDTH, PERSON_CARD_HEIGHT } from "../../core/config.js";
import { translate } from "../../i18n/index.js";
export function familyLayout(tree) {
  const columnStep = PERSON_CARD_WIDTH + 60,
    rowStep = PERSON_CARD_HEIGHT + 90;
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
      ["parent", "adopted", "step_parent"].includes(r.type) &&
      ids.has(r.from) &&
      ids.has(r.to),
  );
  const peers = tree.relations.filter(
    (r) =>
      ["spouse", "partner", "sibling"].includes(r.type) &&
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
      Math.min(4200, Math.sqrt(Math.max(1, tree.people.length)) * columnStep),
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
          const width = u.members.length * columnStep;
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
            row.reduce((sum, u) => sum + u.members.length * columnStep, 0),
          ),
        ) - 60,
      height = (Math.max(...rows.keys()) + 1) * rowStep - 90;
    if (shelfX > 55 && shelfX + width > targetWidth) {
      shelfX = 55;
      shelfY += shelfHeight + 100;
      shelfHeight = 0;
    }
    for (const [level, row] of rows) {
      let x =
        shelfX +
        (width -
          (row.reduce((sum, u) => sum + u.members.length * columnStep, 0) -
            60)) /
          2;
      for (const u of row)
        for (const p of u.members) {
          positions.set(p.id, {
            x,
            y: shelfY + level * rowStep,
          });
          levels.set(p.id, u.level);
          x += columnStep;
        }
    }
    shelfX += width + 110;
    shelfHeight = Math.max(shelfHeight, height);
  }
  const right = Math.max(
      1150,
      ...[...positions.values()].map((p) => p.x + PERSON_CARD_WIDTH),
    ),
    bottom = Math.max(
      0,
      ...[...positions.values()].map((p) => p.y + PERSON_CARD_HEIGHT),
    ),
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
