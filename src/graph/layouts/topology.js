/** Stable connected components include isolated cards and keep input order. */
export function connectedComponents(nodes, links) {
  const neighbors = new Map(nodes.map((node) => [node.key, new Set()]));
  for (const link of links) {
    if (neighbors.has(link.from) && neighbors.has(link.to)) {
      neighbors.get(link.from).add(link.to);
      neighbors.get(link.to).add(link.from);
    }
  }
  const seen = new Set(),
    result = [];
  for (const node of nodes) {
    if (seen.has(node.key)) continue;
    const pending = [node.key],
      keys = new Set();
    for (let i = 0; i < pending.length; i++) {
      const key = pending[i];
      if (seen.has(key)) continue;
      seen.add(key);
      keys.add(key);
      for (const next of neighbors.get(key))
        if (!seen.has(next)) pending.push(next);
    }
    result.push(nodes.filter((item) => keys.has(item.key)));
  }
  return result;
}

/** Collapse directed cycles into peers before assigning levels. */
export function hierarchyLevels(nodes, links, rootKey) {
  if (!nodes.length) return new Map();
  const ids = new Set(nodes.map((node) => node.key));
  const directed = links.filter(
    (link) => link.directed && ids.has(link.from) && ids.has(link.to),
  );
  if (!directed.length) {
    const graph = new Map(nodes.map((node) => [node.key, new Set()]));
    for (const link of links)
      if (ids.has(link.from) && ids.has(link.to)) {
        graph.get(link.from).add(link.to);
        graph.get(link.to).add(link.from);
      }
    const root = ids.has(rootKey)
      ? rootKey
      : [...nodes].sort(
          (a, b) => graph.get(b.key).size - graph.get(a.key).size,
        )[0].key;
    const levels = new Map([[root, 0]]),
      pending = [root];
    for (let i = 0; i < pending.length; i++)
      for (const next of graph.get(pending[i]))
        if (!levels.has(next)) {
          levels.set(next, levels.get(pending[i]) + 1);
          pending.push(next);
        }
    for (const node of nodes)
      if (!levels.has(node.key)) levels.set(node.key, 0);
    return levels;
  }
  const outgoing = new Map(nodes.map((node) => [node.key, []])),
    incoming = new Map(nodes.map((node) => [node.key, []]));
  for (const link of directed) {
    outgoing.get(link.from).push(link.to);
    incoming.get(link.to).push(link.from);
  }
  const seen = new Set(),
    finished = [];
  for (const node of nodes) {
    if (seen.has(node.key)) continue;
    const stack = [[node.key, false]];
    while (stack.length) {
      const [key, finish] = stack.pop();
      if (finish) {
        finished.push(key);
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      stack.push([key, true]);
      for (const next of outgoing.get(key))
        if (!seen.has(next)) stack.push([next, false]);
    }
  }
  const unit = new Map();
  let count = 0;
  for (const key of finished.reverse()) {
    if (unit.has(key)) continue;
    const stack = [key];
    while (stack.length) {
      const next = stack.pop();
      if (unit.has(next)) continue;
      unit.set(next, count);
      for (const parent of incoming.get(next))
        if (!unit.has(parent)) stack.push(parent);
    }
    count++;
  }
  const children = Array.from({ length: count }, () => new Set()),
    degree = Array(count).fill(0),
    level = Array(count).fill(0);
  for (const link of directed) {
    const from = unit.get(link.from),
      to = unit.get(link.to);
    if (from !== to && !children[from].has(to)) {
      children[from].add(to);
      degree[to]++;
    }
  }
  const pending = degree.flatMap((value, index) => (value ? [] : [index]));
  for (let i = 0; i < pending.length; i++)
    for (const child of children[pending[i]]) {
      level[child] = Math.max(level[child], level[pending[i]] + 1);
      if (!--degree[child]) pending.push(child);
    }
  return new Map(nodes.map((node) => [node.key, level[unit.get(node.key)]]));
}
