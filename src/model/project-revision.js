const revisions = new WeakMap();

/** Distinguish edits made within the same millisecond without changing the archive schema. */
export function projectVersion(project) {
  return `${project.updatedAt}|${revisions.get(project) || 0}`;
}
export function advanceProjectRevision(project) {
  revisions.set(project, (revisions.get(project) || 0) + 1);
}
