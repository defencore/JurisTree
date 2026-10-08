import { getLocale } from "../i18n/index.js";
import { graphStateInfo, relTypes } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { fit } from "./camera.js";
import { renderGraphControls } from "./controls.js";
import { renderGraph } from "./render.js";
import { translate } from "../i18n/index.js";
import { edgeState, sourceInScope } from "../model/evidence.js";
import { group, person, relation, withProjectIndex } from "../model/project.js";
import { commit } from "../services/history.js";
import { closeModal } from "../ui/dialog.js";
import { render } from "../ui/render.js";
export function defaultGraphView() {
  return {
    types: Object.keys(relTypes()),
    states: Object.keys(graphStateInfo()),
    hiddenRelations: [],
    showLabels: true,
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
    "showIsolated",
    "documentLinks",
    "propertyLinks",
  ])
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  if (["straight", "curve"].includes(raw.lineStyle))
    out.lineStyle = raw.lineStyle;
  if (["generations", "network", "circle"].includes(raw.layout))
    out.layout = raw.layout;
  return out;
}
export function graphView() {
  return normalizeGraphView(appState.project.graphView);
}
export function fullDiagram() {
  return (
    appState.exportingDiagram === true || appState.exportingDiagram === "full"
  );
}
export function relationShown(r, full = fullDiagram(), ignoreFocus = false) {
  if (full) return true;
  const cfg = graphView();
  if (
    !appState.analysisReveal.has(r.id) &&
    (!cfg.types.includes(r.type) ||
      !cfg.states.includes(edgeState(r)) ||
      cfg.hiddenRelations.includes(r.id))
  )
    return false;
  return (
    ignoreFocus ||
    !appState.graphFocus ||
    appState.graphFocus.relations.includes(r.id)
  );
}
export function visiblePeople(full = fullDiagram()) {
  const cfg = graphView();
  let ps =
    full || !appState.groupFilter
      ? appState.project.people
      : appState.project.people.filter((p) =>
          (p.groupIds || []).includes(appState.groupFilter),
        );
  if (!full && appState.graphFocus)
    ps = ps.filter((p) => appState.graphFocus.people.includes(p.id));
  if (!full && !cfg.showIsolated) {
    const allowed = new Set(ps.map((p) => p.id)),
      linked = new Set(
        appState.project.relations
          .filter(
            (r) => allowed.has(r.from) && allowed.has(r.to) && relationShown(r),
          )
          .flatMap((r) => [r.from, r.to]),
      );
    ps = ps.filter(
      (p) =>
        linked.has(p.id) ||
        (appState.selected?.kind === "person" &&
          appState.selected.id === p.id) ||
        appState.multiSelection.has(p.id),
    );
  }
  return ps;
}
export function resetAnalysis(restoreGroup = true) {
  appState.graphFocus = null;
  appState.analysisHighlight = null;
  appState.analysisReveal.clear();
  appState.analysisExpandedGroups.clear();
  if (restoreGroup && appState.analysisReturnGroup !== null)
    appState.groupFilter =
      appState.analysisReturnGroup && group(appState.analysisReturnGroup)
        ? appState.analysisReturnGroup
        : "";
  appState.analysisReturnGroup = null;
}
export function clearGraphSelection() {
  appState.multiSelection.clear();
  renderGraph();
  renderGraphControls();
}
export function toggleGraphSelection(id) {
  if (!person(id)) return;
  if (appState.multiSelection.has(id)) appState.multiSelection.delete(id);
  else appState.multiSelection.add(id);
  renderGraph();
  renderGraphControls();
}
export function searchGraph(options = {}) {
  const scope = options.scope || "visible",
    cfg = graphView(),
    allowed = new Set(
      (scope === "all" ? appState.project.people : visiblePeople(false)).map(
        (p) => p.id,
      ),
    );
  const types = Array.isArray(options.types)
      ? options.types
      : scope === "all"
        ? Object.keys(relTypes())
        : cfg.types,
    states = Array.isArray(options.states)
      ? options.states
      : scope === "all"
        ? Object.keys(graphStateInfo())
        : cfg.states,
    direction = options.direction || "any";
  const adj = new Map([...allowed].map((id) => [id, []]));
  for (const r of appState.project.relations) {
    if (
      !allowed.has(r.from) ||
      !allowed.has(r.to) ||
      !types.includes(r.type) ||
      !states.includes(edgeState(r)) ||
      (scope !== "all" && !relationShown(r))
    )
      continue;
    const directed = ["parent", "adopted"].includes(r.type);
    if (!directed || direction !== "up")
      adj.get(r.from).push({
        to: r.to,
        id: r.id,
      });
    if (!directed || direction !== "down")
      adj.get(r.to).push({
        to: r.from,
        id: r.id,
      });
  }
  for (const links of adj.values())
    links.sort(
      (a, b) =>
        String(person(a.to)?.name).localeCompare(
          String(person(b.to)?.name),
          getLocale(),
        ) || a.id.localeCompare(b.id),
    );
  return {
    adj,
    allowed,
  };
}
export function graphDistances(adj, from, maxDepth = 600) {
  const distance = new Map([[from, 0]]),
    parents = new Map(),
    queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i],
      depth = distance.get(id);
    if (depth >= maxDepth) continue;
    for (const link of adj.get(id) || []) {
      const next = depth + 1;
      if (!distance.has(link.to)) {
        distance.set(link.to, next);
        parents.set(link.to, [
          {
            from: id,
            id: link.id,
          },
        ]);
        queue.push(link.to);
      } else if (distance.get(link.to) === next)
        parents.get(link.to)?.push({
          from: id,
          id: link.id,
        });
    }
  }
  return {
    distance,
    parents,
  };
}
export function shortestPaths(adj, from, to, maxDepth = 600, limit = 20) {
  if (from === to)
    return {
      paths: [
        {
          people: [from],
          relations: [],
        },
      ],
      limited: false,
    };
  const { distance, parents } = graphDistances(adj, from, maxDepth);
  if (!distance.has(to))
    return {
      paths: [],
      limited: false,
    };
  const paths = [],
    seen = new Set();
  let stopped = false;
  function trace(id, people, relations) {
    if (paths.length > limit) {
      stopped = true;
      return;
    }
    if (id === from) {
      const result = {
          people: [...people].reverse(),
          relations: [...relations].reverse(),
        },
        key = result.relations.join("|");
      if (!seen.has(key)) {
        seen.add(key);
        paths.push(result);
      }
      return;
    }
    for (const p of parents.get(id) || []) {
      trace(p.from, [...people, p.from], [...relations, p.id]);
      if (stopped) return;
    }
  }
  trace(to, [to], []);
  return {
    paths: paths.slice(0, limit),
    limited: stopped || paths.length > limit,
  };
}
export function findGraphPaths(from, to, options = {}) {
  if (!person(from) || !person(to))
    return {
      paths: [],
      reason: "missing",
      limited: false,
    };
  const { adj, allowed } = withProjectIndex(() => searchGraph(options));
  if (!allowed.has(from) || !allowed.has(to))
    return {
      paths: [],
      reason: "hidden",
      limited: false,
    };
  const maxDepth = Math.max(
      1,
      Math.min(
        options.mode === "alternatives" ? 12 : 600,
        Number(options.maxDepth) || 8,
      ),
    ),
    shortest = shortestPaths(adj, from, to, maxDepth);
  if (options.mode !== "alternatives" || !shortest.paths.length || from === to)
    return {
      ...shortest,
      reason: shortest.paths.length ? "" : "not_found",
    };
  const reverse = new Map([...adj.keys()].map((id) => [id, []]));
  for (const [id, links] of adj)
    for (const link of links)
      reverse.get(link.to).push({
        to: id,
        id: link.id,
      });
  const remaining = graphDistances(reverse, to, maxDepth).distance;
  const depth = Math.min(maxDepth, 12),
    queue = [
      {
        people: [from],
        relations: [],
      },
    ],
    paths = [],
    keys = new Set();
  let cursor = 0,
    limited = false;
  while (cursor < queue.length && paths.length <= 20) {
    if (cursor >= 25000 || queue.length >= 50000) {
      limited = true;
      break;
    }
    const path = queue[cursor++],
      id = path.people.at(-1);
    if (id === to) {
      const key = path.relations.join("|");
      if (!keys.has(key)) {
        keys.add(key);
        paths.push(path);
      }
      continue;
    }
    if (path.relations.length >= depth) continue;
    for (const link of adj.get(id) || []) {
      if (
        path.people.includes(link.to) ||
        !remaining.has(link.to) ||
        path.relations.length + 1 + remaining.get(link.to) > depth
      )
        continue;
      queue.push({
        people: [...path.people, link.to],
        relations: [...path.relations, link.id],
      });
    }
  }
  for (const path of shortest.paths) {
    const key = path.relations.join("|");
    if (!keys.has(key)) {
      keys.add(key);
      paths.push(path);
    }
  }
  paths.sort(
    (a, b) =>
      a.relations.length - b.relations.length ||
      a.relations.join("|").localeCompare(b.relations.join("|")),
  );
  return {
    paths: paths.slice(0, 20),
    limited: limited || paths.length > 20,
    reason: "",
  };
}
export function findNeighborhood(from, options = {}) {
  const { adj, allowed } = withProjectIndex(() => searchGraph(options));
  if (!allowed.has(from))
    return {
      people: [],
      relations: [],
      depths: {},
      reason: "hidden",
    };
  const depth = Math.max(1, Math.min(8, Number(options.maxDepth) || 1)),
    { distance } = graphDistances(adj, from, depth),
    people = [...distance.keys()],
    relations = new Set();
  for (const [id, links] of adj)
    if (distance.has(id) && distance.get(id) < depth)
      for (const link of links)
        if (distance.has(link.to)) relations.add(link.id);
  return {
    people,
    relations: [...relations],
    depths: Object.fromEntries(distance),
    reason: "",
  };
}
export function findCommonConnections(from, to, options = {}) {
  const { adj, allowed } = withProjectIndex(() => searchGraph(options));
  if (!allowed.has(from) || !allowed.has(to))
    return {
      people: [],
      relations: [],
      common: [],
      sources: [],
      reason: "hidden",
    };
  const a = new Map(),
    b = new Map();
  for (const [id, store] of [
    [from, a],
    [to, b],
  ])
    for (const link of adj.get(id) || []) {
      if (!store.has(link.to)) store.set(link.to, []);
      store.get(link.to).push(link.id);
    }
  const common = [...a.keys()].filter(
      (id) => id !== from && id !== to && b.has(id),
    ),
    relations = [
      ...new Set(common.flatMap((id) => [...a.get(id), ...b.get(id)])),
    ],
    sources = appState.project.documents
      .filter(
        (d) =>
          sourceInScope(d) && d.people.includes(from) && d.people.includes(to),
      )
      .map((d) => d.id);
  return {
    people: [...new Set([from, to, ...common])],
    relations,
    common,
    sources,
    reason: "",
  };
}
export function findConnectingNetwork(seeds, options = {}) {
  seeds = [...new Set(seeds)].filter((id) => person(id));
  if (seeds.length < 2 || seeds.length > 8)
    return {
      people: [],
      relations: [],
      components: [],
      reason: "seed_count",
    };
  const { adj, allowed } = withProjectIndex(() => searchGraph(options));
  if (seeds.some((id) => !allowed.has(id)))
    return {
      people: [],
      relations: [],
      components: [],
      reason: "hidden",
    };
  const pairs = [];
  for (let i = 0; i < seeds.length; i++)
    for (let j = i + 1; j < seeds.length; j++) {
      const result = shortestPaths(adj, seeds[i], seeds[j], 600, 1);
      if (result.paths.length) pairs.push(result.paths[0]);
    }
  pairs.sort(
    (a, b) =>
      a.relations.length - b.relations.length ||
      a.relations.join("|").localeCompare(b.relations.join("|")),
  );
  const roots = new Map(seeds.map((id) => [id, id])),
    find = (id) => {
      while (roots.get(id) !== id) id = roots.get(id);
      return id;
    },
    people = new Set(seeds),
    relations = new Set();
  for (const path of pairs) {
    const a = find(path.people[0]),
      b = find(path.people.at(-1));
    if (a === b) continue;
    roots.set(b, a);
    path.people.forEach((id) => people.add(id));
    path.relations.forEach((id) => relations.add(id));
  }
  const parts = new Map();
  for (const id of seeds) {
    const root = find(id);
    if (!parts.has(root)) parts.set(root, []);
    parts.get(root).push(id);
  }
  return {
    people: [...people],
    relations: [...relations],
    components: [...parts.values()],
    reason: "",
  };
}
export function applyGraphAnalysis(result, label, focus = false) {
  if (!result?.people?.length) return;
  if (appState.analysisReturnGroup === null)
    appState.analysisReturnGroup = appState.groupFilter;
  appState.groupFilter = "";
  appState.analysisHighlight = {
    ...result,
    label,
  };
  appState.graphFocus = focus
    ? {
        ...result,
        label,
      }
    : null;
  appState.analysisReveal = new Set(result.relations || []);
  appState.analysisExpandedGroups = new Set(
    appState.project.groups
      .filter((g) =>
        appState.project.people.some(
          (p) =>
            result.people.includes(p.id) && (p.groupIds || []).includes(g.id),
        ),
      )
      .map((g) => g.id),
  );
  appState.multiSelection = new Set(result.people.filter((id) => person(id)));
  appState.comparisonPath = null;
  appState.view = "tree";
  closeModal();
  render();
  fit();
}
export function hideGraphRelation(id) {
  if (!relation(id)) return;
  resetAnalysis();
  commit(() => {
    const cfg = graphView();
    cfg.hiddenRelations = [...new Set([...cfg.hiddenRelations, id])];
    appState.project.graphView = cfg;
  });
  fit();
}
export function revealGraphRelation(id) {
  if (!relation(id)) return;
  resetAnalysis();
  commit(() => {
    const cfg = graphView();
    cfg.hiddenRelations = cfg.hiddenRelations.filter((v) => v !== id);
    const r = relation(id);
    if (r && !cfg.types.includes(r.type)) cfg.types.push(r.type);
    if (r && !cfg.states.includes(edgeState(r))) cfg.states.push(edgeState(r));
    appState.project.graphView = cfg;
  });
  fit();
}
export function applyGraphPreset(preset) {
  resetAnalysis();
  const cfg = defaultGraphView();
  if (preset === "family")
    cfg.types = ["parent", "spouse", "sibling", "adopted"];
  if (preset === "social") cfg.types = ["spouse", "partner", "acquaintance"];
  if (preset === "proven") cfg.states = ["official"];
  commit(() => (appState.project.graphView = cfg));
  fit();
}
export function showAnalysisResult(index = null, focus = false) {
  if (!appState.analysisResult) return;
  const { result, mode, from, to, seeds } = appState.analysisResult;
  const value = index !== null ? result.paths[index] : result;
  if (!value) return;
  const seedIds =
      mode === "network" ? seeds : mode === "neighbors" ? [from] : [from, to],
    label =
      mode === "path"
        ? translate("ui.pathBetweenPeople")
        : mode === "neighbors"
          ? translate("ui.personSNeighborhood")
          : mode === "common"
            ? translate("ui.commonConnections")
            : translate("ui.connectingNetwork");
  applyGraphAnalysis(
    {
      ...value,
      seedIds,
    },
    label,
    focus,
  );
  appState.multiSelection = new Set(seedIds);
  renderGraph();
  renderGraphControls();
}
