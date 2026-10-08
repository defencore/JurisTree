import {
  auxiliaryLineStyles,
  graphLineDashes,
  graphStateInfo,
} from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { svgText } from "./render.js";
import { translate } from "../i18n/index.js";
export function graphLineStyle(key) {
  if (Object.hasOwn(auxiliaryLineStyles(), key))
    return auxiliaryLineStyles()[key];
  const [label, color] = graphStateInfo()[key] || graphStateInfo().missing;
  return {
    label,
    color,
    dash: graphLineDashes[key] ?? graphLineDashes.missing,
    width: 1.7,
  };
}
export function graphStrokeAttributes(key, width = null) {
  const style = graphLineStyle(key);
  return `stroke="${style.color}" stroke-width="${width ?? style.width}"${style.dash ? ` stroke-dasharray="${style.dash}"` : ""}`;
}
export function lineSamplePaths(key = "neutral", directed = false) {
  const style =
    key === "neutral"
      ? {
          color: "#536f83",
          width: 1.7,
          dash: "",
        }
      : graphLineStyle(key);
  return `<path d="M2 8H39" fill="none" stroke="${style.color}" stroke-width="${style.width}"${style.dash ? ` stroke-dasharray="${style.dash}"` : ""}/>${directed ? `<path d="M33 3L39 8L33 13" fill="none" stroke="${style.color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
}
export function graphLineSample(key = "neutral", directed = false) {
  return `<svg class="line-sample" data-line-style="${key}" viewBox="0 0 42 16" aria-hidden="true" focusable="false">${lineSamplePaths(key, directed)}</svg>`;
}
export function graphLegendItems() {
  const items = Object.keys(graphStateInfo()).map((key) => ({
    key,
    label: graphLineStyle(key).label,
    section: "proof",
  }));
  items.push(
    {
      key: "neutral",
      directed: true,
      label: translate("ui.parentsAdoptiveParentsChild"),
      section: "role",
    },
    {
      key: "neutral",
      label: translate("ui.otherRelationshipsNoArrow"),
      section: "role",
    },
  );
  if (appState.showDocs)
    items.push({
      key: "source",
      label: auxiliaryLineStyles().source.label,
      section: "role",
    });
  if (appState.project.purpose === "property")
    items.push({
      key: "property",
      label: auxiliaryLineStyles().property.label,
      section: "role",
    });
  return items;
}
export function renderGraphLegend() {
  const items = graphLegendItems(),
    rows = (section) =>
      items
        .filter((i) => i.section === section)
        .map(
          (i) => `<span>${graphLineSample(i.key, i.directed)}${i.label}</span>`,
        )
        .join("");
  $("#legendContent").innerHTML =
    `<p class="legend-group-label">${translate("ui.colorAndDashesSourceState")}</p><div class="legend-states">${rows("proof")}</div><p class="legend-group-label">${translate("ui.lineDirectionAndPurpose")}</p><div class="legend-states">${rows("role")}</div><p class="legend-note">${translate("ui.theLabelShowsRelationshipTypeColorShowsEvidence")}</p>`;
}
export function exportLineLegend(width, y) {
  const items = graphLegendItems(),
    cols = width >= 1100 ? 3 : 2,
    cell = (width - 76) / cols,
    rows = Math.ceil(items.length / cols),
    height = rows * 26 + 80;
  const cells = items
    .map((item, i) => {
      const x = 38 + (i % cols) * cell,
        top = y + 36 + Math.floor(i / cols) * 26;
      return `<g data-legend-line="${item.key}" transform="translate(${x} ${top - 12})">${lineSamplePaths(item.key, item.directed)}${svgText(item.label, 50, 12, 50, 1, 12.5, "#496a80", 400, cell - 55)}</g>`;
    })
    .join("");
  return {
    height,
    markup: `<g class="export-legend"><path d="M38 ${y - 4}H${width - 38}" stroke="#d7e0e6"/>${svgText(translate("ui.lineKeyColorIndicatesSourcesArrowsPointTo"), 38, y + 17, 120, 1, 13, "#36576f", 700)}${cells}${svgText(translate("ui.juristreeSourceStatesAreUserAssessmentsNotLegal"), 38, y + height - 12, 150, 1, 12, "#617584", 400)}</g>`,
  };
}
