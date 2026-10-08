import { getLocale } from "../i18n/index.js";
import {
  GRAPH_FONT,
  PERSON_CARD_HEIGHT,
  PERSON_CARD_WIDTH,
  docStates,
  graphStateInfo,
  relTypes,
} from "../core/config.js";
import { $, $$, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { initials } from "../core/utils.js";
import {
  fullDiagram,
  graphView,
  relationShown,
  visiblePeople,
} from "./analysis.js";
import { applyCamera } from "./camera.js";
import { renderGraphControls } from "./controls.js";
import {
  graphLineStyle,
  graphStrokeAttributes,
  renderGraphLegend,
} from "./legend.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import {
  edgeState,
  hasFile,
  requirements,
  route,
  sourceInScope,
} from "../model/evidence.js";
import { person, withProjectIndex } from "../model/project.js";
import { objectUrl } from "../services/files.js";
import { documentIcon } from "../ui/components.js";
import { svgIcon } from "../ui/icons.js";
export function wrapText(t, max = 24, lines = 2) {
  const words = String(t).split(/\s+/),
    out = [""];
  for (const word of words) {
    let i = out.length - 1;
    if ((out[i] + " " + word).trim().length > max && out[i]) {
      if (out.length >= lines) {
        out[i] = out[i].slice(0, max - 1) + "…";
        break;
      }
      out.push(word);
    } else out[i] = (out[i] + " " + word).trim();
  }
  return out;
}
export function wrapMeasuredText(text, width, lines, size, weight) {
  let remaining = [
    ...String(text ?? "")
      .trim()
      .replace(/\s+/g, " "),
  ];
  const out = [];
  while (remaining.length && out.length < lines) {
    let count = 0,
      space = -1;
    while (
      count < remaining.length &&
      graphTextWidth(remaining.slice(0, count + 1).join(""), size, weight) <=
        width
    ) {
      if (remaining[count] === " ") space = count;
      count++;
    }
    if (count >= remaining.length) {
      out.push(remaining.join(""));
      break;
    }
    if (out.length === lines - 1) {
      let last = remaining.slice(0, Math.max(1, count)).join("").trimEnd();
      while (last && graphTextWidth(last + "…", size, weight) > width)
        last = [...last].slice(0, -1).join("");
      out.push(last + "…");
      break;
    }
    const end = space > 0 ? space : Math.max(1, count);
    out.push(remaining.slice(0, end).join("").trimEnd());
    remaining = remaining.slice(end);
    while (remaining[0] === " ") remaining.shift();
  }
  return out.length ? out : [""];
}
export function svgText(
  t,
  x,
  y,
  max = 24,
  lines = 2,
  size = 15,
  color = "#27293e",
  weight = 600,
  maxWidth = null,
) {
  const fontWeight = weight >= 600 ? 700 : 400,
    rows = maxWidth
      ? wrapMeasuredText(t, maxWidth, lines, size, fontWeight)
      : wrapText(t, max, lines);
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${GRAPH_FONT}" font-size="${size}" font-weight="${fontWeight}">${rows.map((s, i) => `<tspan x="${x}" dy="${i ? size * 1.3 : 0}">${esc(s)}</tspan>`).join("")}</text>`;
}
export function nodeSVG(n, images = null, exporting = false) {
  const multi =
      !exporting &&
      (appState.multiSelection.has(n.id) ||
        (n.kind === "group" &&
          n.members.some((id) => appState.multiSelection.has(id)))),
    focus = !fullDiagram() && appState.analysisHighlight?.people.includes(n.id),
    dim =
      !fullDiagram() &&
      appState.analysisHighlight &&
      n.kind === "person" &&
      !focus &&
      !(
        appState.selected?.kind === "person" && appState.selected.id === n.id
      ) &&
      !multi,
    active =
      !exporting &&
      appState.selected?.kind === n.kind &&
      appState.selected.id === n.id,
    role = n.kind === "person" && !exporting ? graphRole(n.id) : null;
  const family = appState.project.groups.find((g) =>
    (n.groupIds || []).includes(g.id),
  );
  let inside = "",
    stroke = active || multi || focus ? "#254d68" : role?.color || "#bbc6cf";
  if (n.kind === "person") {
    const req = requirements(n),
      ready = req.filter((r) => r.done).length,
      review = req.filter((r) =>
        ["review", "requested"].includes(r.state),
      ).length,
      missing = req.filter((r) => r.state === "missing").length;
    const color = "#4f6474",
      bg = "#edf1f4";
    inside = `<circle cx="42" cy="43" r="26" fill="${bg}"/>${n.avatarId && (images ? images[n.avatarId] : objectUrl(n.avatarId)) ? `<defs><clipPath id="c-${n.id}"><circle cx="42" cy="43" r="26"/></clipPath></defs><image href="${esc(images ? images[n.avatarId] : objectUrl(n.avatarId))}" x="16" y="17" width="52" height="52" preserveAspectRatio="xMidYMid slice" clip-path="url(#c-${n.id})"/>` : `<text x="42" y="49" text-anchor="middle" font-family="${GRAPH_FONT}" fill="${color}" font-size="17" font-weight="700">${esc(initials(n.name))}</text>`}${svgText(n.name, 83, 35, 17, 2, 16, "#263545", 700, PERSON_CARD_WIDTH - 96)}${svgText(years(n), 16, 85, 40, 1, 14, "#465d70", 400, PERSON_CARD_WIDTH - (exporting ? 32 : 74))}<path d="M15 99H${PERSON_CARD_WIDTH - 15}" stroke="#dbe3ea"/>${svgText(translate("ui.documents"), 16, 116, 25, 1, 14, "#405d74", 400)}`;
    const badges = [
      [`${translate("ui.available3")} ${ready}`, "#21664b", "#edf6f0"],
      [`${translate("ui.missing")} ${missing}`, "#805b19", "#fff5df"],
      [`${translate("ui.review")} ${review}`, "#674d89", "#f3eff8"],
    ];
    let badgeX = 0;
    const badgeMarkup = badges
      .map(([text, color, background]) => {
        const pill = svgPill(text, badgeX, 0, color, background, 14, 6);
        badgeX += pill.width + 4;
        return pill.svg;
      })
      .join("");
    const badgeScale = Math.min(1, (PERSON_CARD_WIDTH - 32) / (badgeX - 4));
    inside += `<g transform="translate(16 124) scale(${badgeScale})">${badgeMarkup}</g>`;
    if (role) {
      const p = svgPill(role.label, 14, -13, role.color, role.bg, 12.5);
      inside += p.svg;
    }
    if (n.id === appState.project.subjectId)
      inside += `<g><circle cx="${PERSON_CARD_WIDTH - 16}" cy="16" r="9" fill="#eeecff"/>${svgIcon("fingerprint", PERSON_CARD_WIDTH - 22, 10, "#254d68", 0.5)}</g>`;
    if (!role && family && !active && !multi && !focus) stroke = family.color;
  } else if (n.kind === "document") {
    const s = docStates()[n.status] || docStates().needs_review,
      c =
        s.tone === "available"
          ? "#21664b"
          : s.tone === "review"
            ? "#674d89"
            : s.tone === "requested"
              ? "#225c8b"
              : "#805b19";
    inside = `<rect x="15" y="17" width="34" height="40" rx="8" fill="#edf3f8"/>${svgIcon(documentIcon(n), 21, 24, "#426c89", 0.75)}${svgText(n.title, 59, 32, 22, 2, 14, "#2c4b63", 700, n.w - 72)}<path d="M15 80H${n.w - 15}" stroke="#ececf4"/>${svgIcon(s.icon, 15, 93, c, 0.65)}${svgText(s.label, 37, 106, 23, 1, 14, c, 400, n.w - 50)}${svgText(hasFile(n) ? translate("ui.fileAttached2") : translate("ui.noDigitalCopy2"), 15, 70, 35, 1, 12.5, "#526d81", 400)}`;
  } else if (n.kind === "group") {
    inside = `<rect x="16" y="17" width="43" height="43" rx="12" fill="${n.color}" fill-opacity=".1"/>${svgIcon("users", 26, 27, n.color, 0.9)}${svgText(n.name, 73, 38, 20, 2, 16, "#2a485e", 700, n.w - 85)}${svgText(
      n.members.length +
        ` ${translate("ui.peopleGaps")} ` +
        n.members
          .map(person)
          .flatMap(requirements)
          .filter((r) => !r.done).length,
      16,
      89,
      34,
      1,
      12.5,
      n.color,
      550,
    )}${svgText(translate("ui.clickToExpand"), 16, 111, 34, 1, 12.5, "#526d81", 400)}`;
    if (!multi && !focus && !active) stroke = n.color;
  } else {
    inside = `<rect x="16" y="17" width="38" height="42" rx="10" fill="#eaf7f0"/>${svgIcon("home", 24, 27, "#148469", 0.9)}${svgText(n.title, 66, 35, 22, 2, 15)}${svgText(n.value ? new Intl.NumberFormat(getLocale()).format(Number(n.value)) + " " + n.currency : translate("ui.valueNotSpecified"), 16, 94, 31, 1, 13, "#8c92a7", 400)}`;
  }
  const biography =
    n.kind === "person" && !exporting
      ? `<g class="graph-biography" data-biography="${n.id}" transform="translate(${n.x + PERSON_CARD_WIDTH - 42} ${n.y + 70})" role="button" tabindex="0" aria-label="${esc(translate("ui.viewAutobiographyOf", { name: n.name }))}" opacity="${dim ? 0.3 : 1}"><title>${esc(translate("ui.autobiography"))}</title><rect class="biography-hit" x="-8" y="-10" width="44" height="44" fill="transparent"/><rect width="28" height="24" rx="4" fill="#edf3f8" stroke="#b9cddd"/>${svgIcon("book", 6, 4, "#315d7c", 0.65)}</g>`
      : "";
  return `<g class="node${multi ? " multi" : ""}" opacity="${dim ? 0.3 : 1}" data-node="${n.id}" data-kind="${n.kind}" transform="translate(${n.x} ${n.y})" tabindex="0" role="button" aria-label="${esc(n.name || n.title)}"><rect class="card" width="${n.w}" height="${n.h}" rx="6" fill="#fff" stroke="${stroke}" stroke-opacity="${active || multi || focus || role ? 1 : 0.6}" stroke-width="${active || multi || focus ? 2.3 : role ? 1.7 : 1}" />${inside}</g>${biography}`;
}
export function connection(a, b, horizontal = false) {
  let x1 = a.x + a.w / 2,
    y1 = a.y + a.h,
    x2 = b.x + b.w / 2,
    y2 = b.y;
  if (horizontal || Math.abs(a.y - b.y) < 70) {
    const forward = b.x >= a.x;
    x1 = a.x + (forward ? a.w : 0);
    y1 = a.y + a.h / 2;
    x2 = b.x + (forward ? 0 : b.w);
    y2 = b.y + b.h / 2;
    return {
      path: `M${x1} ${y1} C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}`,
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
  }
  if (b.y < a.y) {
    y1 = a.y;
    y2 = b.y + b.h;
  }
  const mid = (y1 + y2) / 2;
  return {
    path: `M${x1} ${y1} C${x1} ${mid},${x2} ${mid},${x2} ${y2}`,
    x: (x1 + x2) / 2,
    y: mid,
  };
}
export function renderGraph() {
  if (!appState.project) return;
  return withProjectIndex(renderGraphAll);
}
export function renderGraphAll() {
  renderGraphControls();
  renderGraphLegend();
  $("#graphDefs").innerHTML = graphDefs();
  $("#scene").innerHTML = renderFilteredGraph();
  applyCamera();
  $$('[data-action="undo"]').forEach(
    (b) => (b.disabled = !appState.history.length),
  );
  $$('[data-action="redo"]').forEach(
    (b) => (b.disabled = !appState.future.length),
  );
}
export function roleGroup(r, id) {
  if (["parent", "adopted"].includes(r.type))
    return r.to === id ? "parents" : "children";
  return r.type === "spouse" ? "partners" : "other";
}
export function roleLabel(r, id) {
  const other = person(r.from === id ? r.to : r.from),
    female = other?.gender === "f",
    male = other?.gender === "m";
  const group = roleGroup(r, id);
  if (r.type === "adopted")
    return group === "parents"
      ? translate("ui.adoptiveParent")
      : translate("ui.adoptedChild");
  if (group === "parents")
    return female
      ? translate("ui.mother")
      : male
        ? translate("ui.father")
        : translate("ui.parent");
  if (group === "children")
    return female
      ? translate("ui.daughter")
      : male
        ? translate("ui.son")
        : translate("ui.child");
  if (group === "partners")
    return female
      ? translate("ui.partner")
      : male
        ? translate("ui.partner2")
        : translate("ui.partner3");
  return r.type === "sibling"
    ? female
      ? translate("ui.sister")
      : male
        ? translate("ui.brother")
        : translate("ui.sibling")
    : relTypes()[r.type];
}
export function graphRole(id) {
  if (appState.selected?.kind !== "person") return null;
  if (id === appState.selected.id)
    return {
      kind: "self",
      label: translate("ui.selectedPerson"),
      color: "#254d68",
      bg: "#e8eff4",
    };
  const r = appState.project.relations.find(
    (r) =>
      ["parent", "adopted"].includes(r.type) &&
      ((r.from === appState.selected.id && r.to === id) ||
        (r.to === appState.selected.id && r.from === id)),
  );
  if (!r) return null;
  return roleGroup(r, appState.selected.id) === "parents"
    ? {
        kind: "parent",
        label: roleLabel(r, appState.selected.id),
        color: "#4e6a82",
        bg: "#edf2f6",
      }
    : {
        kind: "child",
        label: roleLabel(r, appState.selected.id),
        color: "#148469",
        bg: "#eaf7f0",
      };
}
export function graphDefs() {
  return Object.keys(graphStateInfo())
    .map(
      (k) =>
        `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="${graphLineStyle(k).color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
    )
    .join("");
}
export function svgPill(text, x, y, color, bg, size = 12, padding = 8) {
  const width = Math.min(
    PERSON_CARD_WIDTH - 28,
    graphTextWidth(text, size, 700) + padding * 2,
  );
  return {
    width,
    svg: `<rect x="${x}" y="${y}" width="${width}" height="23" rx="3" fill="${bg}"/>${svgText(text, x + padding, y + 16.5, 34, 1, size, color, 700, width - padding * 2)}`,
  };
}
export function groupBackdrop(nodes) {
  return appState.project.groups
    .filter(
      (g) =>
        fullDiagram() ||
        !g.collapsed ||
        appState.analysisExpandedGroups.has(g.id),
    )
    .map((g) => {
      const ps = nodes.filter(
        (n) => n.kind === "person" && (n.groupIds || []).includes(g.id),
      );
      if (!ps.length) return "";
      const x = Math.min(...ps.map((p) => p.x)) - 19,
        y = Math.min(...ps.map((p) => p.y)) - 43,
        w = Math.max(...ps.map((p) => p.x + p.w)) - x + 19,
        h = Math.max(...ps.map((p) => p.y + p.h)) - y + 20;
      return `<g class="group-background"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#f4f6f8" fill-opacity=".6" stroke="${g.color}" stroke-opacity=".18" stroke-dasharray="6 5"/><g data-toggle-group="${g.id}" tabindex="0" role="button" aria-label="${translate("ui.collapseGroup")} ${esc(g.name)}" style="cursor:pointer">${svgIcon("users", x + 16, y + 10, g.color, 0.7)}${svgText(g.name + " · " + ps.length, x + 40, y + 25, 55, 1, 13, g.color, 600)}${svgIcon("fold", x + w - 33, y + 10, g.color, 0.65)}</g></g>`;
    })
    .join("");
}
export function graphTextWidth(text, size = 12, weight = 600) {
  const fontWeight = weight >= 600 ? 700 : 400,
    key = fontWeight + "|" + size + "|" + text;
  if (appState.graphWidthCache.has(key))
    return appState.graphWidthCache.get(key);
  appState.graphMeasureContext ??= document
    .createElement("canvas")
    .getContext("2d");
  appState.graphMeasureContext.font = `${fontWeight} ${size}px ${GRAPH_FONT}`;
  const width = Math.ceil(appState.graphMeasureContext.measureText(text).width);
  if (appState.graphWidthCache.size > 4000) appState.graphWidthCache.clear();
  appState.graphWidthCache.set(key, width);
  return width;
}
export function filteredGraphNodes() {
  const full = fullDiagram(),
    shown = visiblePeople(full),
    collapsed = full
      ? []
      : appState.project.groups.filter(
          (g) =>
            g.collapsed &&
            !appState.analysisExpandedGroups.has(g.id) &&
            (!appState.groupFilter || appState.groupFilter === g.id),
        ),
    hidden = new Set(),
    ns = [];
  for (const g of collapsed) {
    const members = shown.filter(
      (p) => (p.groupIds || []).includes(g.id) && !hidden.has(p.id),
    );
    if (!members.length) continue;
    members.forEach((p) => hidden.add(p.id));
    ns.push({
      ...g,
      kind: "group",
      members: members.map((p) => p.id),
      x: Number.isFinite(g.x) ? g.x : Math.min(...members.map((p) => p.x)),
      y: Number.isFinite(g.y) ? g.y : Math.min(...members.map((p) => p.y)),
      w: PERSON_CARD_WIDTH,
      h: 130,
    });
  }
  ns.push(
    ...shown
      .filter((p) => !hidden.has(p.id))
      .map((p) => ({
        ...p,
        kind: "person",
        w: PERSON_CARD_WIDTH,
        h: PERSON_CARD_HEIGHT,
      })),
  );
  const peopleIds = new Set(shown.map((p) => p.id));
  if (appState.showDocs)
    ns.push(
      ...appState.project.documents
        .filter(
          (d) =>
            (full || sourceInScope(d)) &&
            (full ||
              d.people.some((id) => peopleIds.has(id)) ||
              (!appState.groupFilter && !appState.graphFocus)),
        )
        .map((d, i) => ({
          ...d,
          kind: "document",
          x: Number.isFinite(d.x) ? d.x : 40 + i * 255,
          y: Number.isFinite(d.y) ? d.y : 780,
          w: 228,
          h: 128,
        })),
    );
  if (appState.project.purpose === "property")
    ns.push(
      ...appState.project.property
        .filter(
          (a) =>
            full ||
            !appState.graphFocus ||
            peopleIds.has(a.ownerId) ||
            (a.allocations || []).some((x) => peopleIds.has(x.personId)),
        )
        .map((a, i) => ({
          ...a,
          kind: "property",
          x: Number.isFinite(a.x) ? a.x : 680,
          y: Number.isFinite(a.y) ? a.y : 65 + i * 180,
          w: 245,
          h: 128,
        })),
    );
  return ns;
}
export function graphLine(a, b, horizontal = false, offset = 0) {
  const c = connection(a, b, horizontal);
  if (graphView().lineStyle === "straight") {
    const coordinates = c.path.match(
      /M([\d.-]+) ([\d.-]+).*?,([\d.-]+) ([\d.-]+)$/,
    );
    if (coordinates)
      c.path = `M${coordinates[1]} ${coordinates[2]} L${coordinates[3]} ${coordinates[4]}`;
  }
  if (offset) {
    c.x += horizontal ? 0 : offset;
    c.y += horizontal ? offset : 0;
  }
  return c;
}
export function renderFilteredGraph(images = null, exporting = false) {
  const ns = filteredGraphNodes(),
    map = new Map(ns.map((n) => [n.id, n]));
  ns.filter((n) => n.kind === "group").forEach((n) =>
    n.members.forEach((id) => map.set(id, n)),
  );
  const full = fullDiagram(),
    cfg = graphView(),
    highlight = full ? null : appState.analysisHighlight,
    path = highlight || appState.comparisonPath || route(),
    seen = new Set();
  let edges = "";
  for (const r of appState.project.relations) {
    if (!relationShown(r, full)) continue;
    const a = map.get(r.from),
      b = map.get(r.to);
    if (!a || !b || a.id === b.id) continue;
    const key = a.id + "|" + b.id + "|" + r.type;
    if ((a.kind === "group" || b.kind === "group") && seen.has(key)) continue;
    seen.add(key);
    const direction = ["parent", "adopted"].includes(r.type),
      c = graphLine(
        a,
        b,
        ["spouse", "sibling", "acquaintance"].includes(r.type),
      ),
      state = edgeState(r),
      onpath = (path.relations || []).includes(r.id),
      active =
        !exporting &&
        appState.selected?.kind === "relation" &&
        appState.selected.id === r.id,
      near =
        !exporting &&
        appState.selected?.kind === "person" &&
        (r.from === appState.selected.id || r.to === appState.selected.id);
    const label =
      a.kind === "group" || b.kind === "group"
        ? translate("ui.familyConnection")
        : r.type === "parent"
          ? person(r.from)?.gender === "f"
            ? translate("ui.mother2")
            : person(r.from)?.gender === "m"
              ? translate("ui.father2")
              : translate("ui.parent2")
          : r.type === "spouse"
            ? translate("ui.partners2")
            : r.type === "sibling"
              ? translate("ui.sibling2")
              : r.type === "adopted"
                ? translate("ui.adoption2")
                : r.type === "acquaintance"
                  ? translate("ui.acquaintance2")
                  : translate("ui.possibleConnection");
    const width = graphTextWidth(label, 14, 400) + 16,
      horizontal = !direction && Math.abs(a.y - b.y) < 70,
      ly =
        horizontal && Math.abs(b.x - a.x) - (a.w + b.w) / 2 < width + 12
          ? Math.min(a.y, b.y) - 17
          : c.y + (direction ? (a.x < b.x ? -12 : a.x > b.x ? 12 : 0) : 0),
      opacity = highlight && !onpath ? 0.22 : 1;
    edges += `<g class="edge" data-edge="${r.id}" role="button" tabindex="0" opacity="${opacity}" aria-label="${esc(person(r.from)?.name + " — " + label + " — " + person(r.to)?.name)}"><path d="${c.path}" fill="none" stroke="transparent" stroke-width="18"/>${onpath || active ? `<path d="${c.path}" fill="none" stroke="#d3e1eb" stroke-width="8" stroke-linecap="round"/>` : ""}<path d="${c.path}" fill="none" ${graphStrokeAttributes(state, near || onpath || active ? 2.6 : 1.7)} ${direction ? `marker-end="url(#arrow-${state})"` : ""}/>${full || cfg.showLabels ? `<rect x="${c.x - width / 2}" y="${ly - 10}" width="${width}" height="22" rx="3" fill="#fff" fill-opacity=".95"/>${svgText(label, c.x - width / 2 + 8, ly + 5, 38, 1, 14, near ? "#30475b" : "#405e75", 400)}` : ""}</g>`;
  }
  if (appState.showDocs && (full || cfg.documentLinks))
    for (const d of appState.project.documents) {
      const n = map.get(d.id);
      if (!n) continue;
      const linked = new Set();
      for (const id of d.people) {
        const p = map.get(id);
        if (!p || linked.has(p.id)) continue;
        linked.add(p.id);
        const c = graphLine(n, p);
        edges += `<path d="${c.path}" fill="none" ${graphStrokeAttributes("source")} opacity="${highlight ? 0.3 : 1}"/>`;
      }
    }
  if (appState.project.purpose === "property" && (full || cfg.propertyLinks))
    for (const a of appState.project.property) {
      const n = map.get(a.id);
      if (!n) continue;
      for (const al of a.allocations || []) {
        const p = map.get(al.personId);
        if (!p) continue;
        const c = graphLine(n, p);
        edges += `<path d="${c.path}" fill="none" ${graphStrokeAttributes("property")}/>${svgText(al.percent + "%", c.x, c.y, 12, 1, 13, "#287454", 600)}`;
      }
    }
  return (
    groupBackdrop(ns) +
    edges +
    ns.map((n) => nodeSVG(n, images, exporting)).join("")
  );
}
