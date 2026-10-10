import { esc } from "../core/dom.js";
import { translate as t } from "../i18n/index.js";
import {
  drawnRegion,
  movedRegion,
  resizedRegion,
} from "../model/region-geometry.js";

/** Pointer positions are normalized to the displayed original, independent of zoom and scrolling. */
export function bindRegionCanvas(
  root,
  { regions, selected, select, create, remove, change },
  signal,
) {
  const stage = root.querySelector(".media-image-stage"),
    overlay = root.querySelector(".media-region-overlay"),
    viewport = root.querySelector(".media-image-viewport");
  const options = { signal };
  let drawing = false,
    drag = null,
    zoom = 1;
  function resize() {
    const centerX =
      (viewport.scrollLeft + viewport.clientWidth / 2) /
      (stage.clientWidth || 1);
    stage.style.width = `${Math.max(120, viewport.clientWidth - 24) * zoom}px`;
    viewport.scrollLeft =
      centerX * stage.clientWidth - viewport.clientWidth / 2;
  }
  function point(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }
  function render() {
    overlay.hidden =
      !root.querySelector("[data-media-marks]").checked && !drawing;
    overlay.innerHTML = regions()
      .filter((r) => r.rect)
      .map((region) => {
        const { x, y, width, height } = region.rect,
          active = selected()?.id === region.id;
        return `<div class="media-region-box ${active ? "active" : ""}" data-region-box="${region.id}" tabindex="0" role="button" aria-label="${esc(region.title || t("ui.imageRegion"))}" aria-pressed="${active}" style="left:${x * 100}%;top:${y * 100}%;width:${width * 100}%;height:${height * 100}%"><span>${esc(region.title || String(regions().indexOf(region) + 1))}</span>${active ? ["nw", "ne", "sw", "se"].map((corner) => `<i class="media-region-handle ${corner}" data-region-handle="${corner}"></i>`).join("") : ""}</div>`;
      })
      .join("");
  }
  function setDrawing(value) {
    drawing = value;
    stage.classList.toggle("drawing", value);
    root
      .querySelector("[data-media-draw]")
      .setAttribute("aria-pressed", String(value));
    root.querySelector("[data-media-hint]").textContent = t(
      value ? "ui.imageDrawHint" : "ui.imageSelectHint",
    );
    render();
  }
  stage.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || drag) return;
      const box = event.target.closest("[data-region-box]");
      if (!drawing && !box) return;
      event.preventDefault();
      const start = point(event);
      const previous = selected()?.id;
      if (drawing) {
        if (!create(drawnRegion(start, start))) return;
      } else select(box.dataset.regionBox);
      const region = selected();
      if (!region?.rect) return;
      drag = {
        pointerId: event.pointerId,
        start,
        rect: { ...region.rect },
        id: region.id,
        previous,
        mode: drawing ? "draw" : event.target.dataset.regionHandle || "move",
      };
      stage.setPointerCapture(event.pointerId);
      render();
    },
    options,
  );
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const region = regions().find((r) => r.id === drag.id);
      if (!region) return;
      const position = point(event);
      region.rect =
        drag.mode === "draw"
          ? drawnRegion(drag.start, position)
          : drag.mode === "move"
            ? movedRegion(
                drag.rect,
                position.x - drag.start.x,
                position.y - drag.start.y,
              )
            : resizedRegion(drag.rect, drag.mode, position);
      render();
      change();
    },
    options,
  );
  function finish(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.type === "pointercancel") {
      const region = regions().find((r) => r.id === drag.id);
      if (drag.mode === "draw") remove(drag.id, drag.previous);
      else if (region) region.rect = drag.rect;
    }
    if (stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
    drag = null;
    setDrawing(false);
    change();
  }
  stage.addEventListener("pointerup", finish, options);
  stage.addEventListener("pointercancel", finish, options);
  stage.addEventListener(
    "keydown",
    (event) => {
      const box = event.target.closest("[data-region-box]");
      if (!box) return;
      const region = regions().find((r) => r.id === box.dataset.regionBox);
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        select(region.id);
        render();
      }
      const delta = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];
      if (delta) {
        event.preventDefault();
        select(region.id);
        const step = event.shiftKey ? 0.01 : 0.001;
        region.rect = movedRegion(
          region.rect,
          delta[0] * step,
          delta[1] * step,
        );
        render();
        change();
        overlay.querySelector(`[data-region-box="${region.id}"]`)?.focus();
      }
    },
    options,
  );
  root
    .querySelector("[data-media-draw]")
    .addEventListener("click", () => setDrawing(!drawing), options);
  root
    .querySelector("[data-media-marks]")
    .addEventListener("change", render, options);
  root.querySelector("[data-media-zoom]").addEventListener(
    "input",
    (event) => {
      zoom = Number(event.target.value);
      resize();
      root.querySelector("[data-media-zoom-value]").textContent =
        `${Math.round(zoom * 100)}%`;
    },
    options,
  );
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  resize();
  render();
  return { render, setDrawing };
}
