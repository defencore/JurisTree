import { emptyPersonFilter } from "../core/person-filter-fields.js";
import { state } from "../core/state.js";
import { getLanguage } from "../i18n/index.js";
import { localDateString } from "./dates.js";
import { evaluatePersonFilter } from "./person-filters.js";

let cache;
export function personFilterReport() {
  const today = localDateString();
  const key = [
    state.project.updatedAt,
    today,
    getLanguage(),
    state.groupFilter,
    JSON.stringify(state.personFilter),
  ].join("|");
  if (!cache || cache.project !== state.project || cache.key !== key)
    cache = {
      project: state.project,
      key,
      report: evaluatePersonFilter(state.project, state.personFilter, {
        today,
        files: state.blobs,
        groupId: state.groupFilter,
      }),
    };
  return cache.report;
}
export function resetPersonFilter() {
  state.personFilter = emptyPersonFilter();
  cache = null;
}
export function personPassesFilter(id) {
  return !state.personFilter.rules.length || personFilterReport().ids.has(id);
}
