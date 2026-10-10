import { getLanguage } from "../i18n/index.js";
import { localDateString } from "./dates.js";
import { projectVersion } from "./project-revision.js";
import { buildSearchIndex } from "./search.js";

let cache;

/** Share the current workspace search index across global search and analytical filters. */
export function projectSearchIndex(project) {
  const key = [projectVersion(project), getLanguage(), localDateString()].join(
    "|",
  );
  if (cache?.project !== project || cache.key !== key)
    cache = { project, key, index: buildSearchIndex(project) };
  return cache.index;
}
