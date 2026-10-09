import { GRAPH_FONT, PERSON_CARD_WIDTH } from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
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
  color = "#081f3c",
  weight = 600,
  maxWidth = null,
) {
  const fontWeight = weight >= 600 ? 700 : 400,
    rows = maxWidth
      ? wrapMeasuredText(t, maxWidth, lines, size, fontWeight)
      : wrapText(t, max, lines);
  return `<text x="${x}" y="${y}" fill="${color}" text-rendering="geometricPrecision" font-family="${GRAPH_FONT}" font-size="${size}" font-weight="${fontWeight}">${rows.map((s, i) => `<tspan x="${x}" dy="${i ? size * 1.3 : 0}">${esc(s)}</tspan>`).join("")}</text>`;
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
