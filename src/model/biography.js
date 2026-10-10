import { state } from "../core/state.js";
import { createProjectIndex } from "./project-index.js";

/** Collect the complete profile, sharing an index during directory rendering or search. */
export function personBiography(project, id, index = null) {
  index ||=
    state.renderIndex?.project === project
      ? state.renderIndex
      : createProjectIndex(project);
  const profile = index.people.get(id);
  if (!profile) return null;
  const groupIds = new Set(profile.groupIds || []);
  return {
    profile,
    relations: index.personRelations.get(id) || [],
    property: index.personProperty.get(id) || [],
    documents: index.profileDocs.get(id) || [],
    testimony: index.testimony.get(id) || [],
    groups: project.groups.filter((group) => groupIds.has(group.id)),
  };
}
