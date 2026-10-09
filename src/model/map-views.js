import { normalizeDiagram } from "./diagram.js";
import { CAMERA_MAX_ZOOM, CAMERA_MIN_ZOOM } from "../core/config.js";
import { normalizeGraphView } from "../core/graph-view.js";
import { normalizePersonFilter } from "../core/person-filter-fields.js";
import { clone } from "../core/utils.js";

export const MAP_VIEW_LIMIT = 20;
const nodeLists = { people: 600, groups: 150, documents: 1200, property: 500 };
const coordinate = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= 100000;

/** Store the world point at the viewport center so views work on other screens. */
export function mapViewCamera(camera, viewport) {
  return {
    x: (viewport.width / 2 - camera.x) / camera.z,
    y: (viewport.height / 2 - camera.y) / camera.z,
    z: camera.z,
  };
}
export function cameraForMapView(camera, viewport) {
  return {
    x: viewport.width / 2 - camera.x * camera.z,
    y: viewport.height / 2 - camera.y * camera.z,
    z: camera.z,
  };
}

/** Validate snapshots independently of profile data; discard references to deleted items. */
export function normalizeMapView(raw, project) {
  const invalid = () => {
    throw Error("Invalid saved map view");
  };
  if (!raw || typeof raw !== "object") invalid();
  const name =
    typeof raw.name === "string" ? raw.name.trim().slice(0, 150) : "";
  if (!name || typeof raw.id !== "string" || !/^[\w-]{1,100}$/.test(raw.id))
    invalid();
  const savedAt = new Date(raw.savedAt);
  if (typeof raw.savedAt !== "string" || !Number.isFinite(savedAt.getTime()))
    invalid();
  const camera = raw.camera;
  if (
    !camera ||
    ![camera.x, camera.y].every(
      (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e7,
    ) ||
    typeof camera.z !== "number" ||
    !Number.isFinite(camera.z) ||
    camera.z < CAMERA_MIN_ZOOM ||
    camera.z > CAMERA_MAX_ZOOM
  )
    invalid();
  const positions = {},
    ids = {};
  for (const [key, limit] of Object.entries(nodeLists)) {
    ids[key] = new Set(project[key].map((item) => item.id));
    const entries = raw.positions?.[key];
    if (!Array.isArray(entries) || entries.length > limit) invalid();
    const seen = new Set();
    positions[key] = entries.flatMap((item) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !/^[\w-]{1,100}$/.test(item.id) ||
        seen.has(item.id) ||
        ![item.x, item.y].every((v) => v === null || coordinate(v))
      )
        invalid();
      seen.add(item.id);
      return ids[key].has(item.id)
        ? [
            {
              id: item.id,
              x: item.x,
              y: item.y,
              ...(key === "groups"
                ? { collapsed: item.collapsed === true }
                : {}),
            },
          ]
        : [];
    });
  }
  ids.relations = new Set(project.relations.map((r) => r.id));
  const references = (value, key) => {
    if (
      !Array.isArray(value) ||
      value.length > (key === "relations" ? 2500 : nodeLists[key])
    )
      invalid();
    return [
      ...new Set(
        value.filter((id) => typeof id === "string" && ids[key].has(id)),
      ),
    ];
  };
  const result = (value) => {
    if (value === null) return null;
    if (!value || typeof value !== "object") invalid();
    return {
      people: references(value.people, "people"),
      relations: references(value.relations, "relations"),
    };
  };
  const visibility = raw.visibility;
  if (!visibility || typeof visibility !== "object") invalid();
  const focus = result(visibility.focus),
    highlight = result(visibility.highlight);
  if (highlight)
    highlight.label = String(visibility.highlight.label || name).slice(0, 300);
  const selectionKeys = {
    person: "people",
    group: "groups",
    document: "documents",
    property: "property",
    relation: "relations",
  };
  const selected = visibility.selected;
  return {
    id: raw.id,
    name,
    savedAt: savedAt.toISOString(),
    camera: { x: camera.x, y: camera.y, z: camera.z },
    positions,
    graphView: normalizeGraphView(raw.graphView, ids.relations),
    diagram: normalizeDiagram(raw.diagram, project),
    visibility: {
      groupId: ids.groups.has(visibility.groupId) ? visibility.groupId : "",
      personFilter: normalizePersonFilter(visibility.personFilter),
      showDocs: visibility.showDocs === true,
      focus,
      highlight,
      revealedRelations: references(visibility.revealedRelations, "relations"),
      expandedGroups: references(visibility.expandedGroups, "groups"),
      selected:
        selected && ids[selectionKeys[selected.kind]]?.has(selected.id)
          ? { kind: selected.kind, id: selected.id }
          : null,
      selection: references(visibility.selection, "people"),
    },
  };
}

export function captureMapView(project, runtime, viewport, { id, name }) {
  return normalizeMapView(
    {
      id,
      name,
      savedAt: new Date().toISOString(),
      camera: mapViewCamera(runtime.camera, viewport),
      positions: Object.fromEntries(
        Object.keys(nodeLists).map((key) => [
          key,
          project[key].map((item) => ({
            id: item.id,
            x: coordinate(item.x) ? item.x : null,
            y: coordinate(item.y) ? item.y : null,
            ...(key === "groups" ? { collapsed: item.collapsed === true } : {}),
          })),
        ]),
      ),
      graphView: project.graphView,
      diagram: project.diagram,
      visibility: {
        groupId: runtime.groupFilter,
        personFilter: runtime.personFilter,
        showDocs: runtime.showDocs,
        focus: runtime.graphFocus,
        highlight: runtime.analysisHighlight,
        revealedRelations: [...runtime.analysisReveal],
        expandedGroups: [...runtime.analysisExpandedGroups],
        selected: runtime.selected,
        selection: [...runtime.multiSelection],
      },
    },
    project,
  );
}

/** Apply only placement and display settings, leaving people and relationships intact. */
export function restoreMapView(project, raw) {
  const view = normalizeMapView(raw, project);
  for (const key of Object.keys(nodeLists)) {
    const positions = new Map(
      view.positions[key].map((item) => [item.id, item]),
    );
    for (const item of project[key]) {
      const position = positions.get(item.id);
      if (!position) continue;
      item.x = position.x;
      item.y = position.y;
      if (key === "groups") item.collapsed = position.collapsed;
    }
  }
  project.graphView = clone(view.graphView);
  project.diagram = clone(view.diagram);
  return clone(view);
}
