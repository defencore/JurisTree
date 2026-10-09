/** An undirected, one-step view of explicitly recorded relationships. */
export function directConnections(project, rootId) {
  const existing = new Set(project.people.map((p) => p.id));
  if (!existing.has(rootId)) return null;
  const people = new Set([rootId]),
    relations = new Set();
  for (const r of project.relations) {
    if (r.from === r.to || !existing.has(r.from) || !existing.has(r.to))
      continue;
    if (r.from !== rootId && r.to !== rootId) continue;
    people.add(r.from);
    people.add(r.to);
    relations.add(r.id);
  }
  return { rootId, people, relations };
}
