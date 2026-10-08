import { translate } from "../i18n/index.js";
import { icon } from "./icons.js";

export function windowControls() {
  return `<button type="button" class="iconbtn small ghost" data-reset-window aria-label="${translate("ui.resetWindowPosition")}" title="${translate("ui.resetWindowPosition")}">${icon("layout")}</button>`;
}
export function resetWindow(element) {
  element.removeAttribute("data-floating");
  for (const key of ["left", "top", "width", "height"])
    element.style.removeProperty(key);
}
export function clampWindow(position, size, viewport) {
  return {
    x: Math.max(8, Math.min(position.x, viewport.width - size.width - 8)),
    y: Math.max(8, Math.min(position.y, viewport.height - size.height - 8)),
  };
}
function move(element, x, y) {
  const rect = element.getBoundingClientRect();
  if (element.id === "inspector" && !element.hasAttribute("data-floating")) {
    element.style.width = rect.width + "px";
    element.style.height = rect.height + "px";
  }
  const position = clampWindow(
    { x, y },
    { width: rect.width, height: rect.height },
    { width: innerWidth, height: innerHeight },
  );
  element.setAttribute("data-floating", "");
  element.style.left = position.x + "px";
  element.style.top = position.y + "px";
}
export function bindFloatingWindows() {
  let drag = null;
  document.addEventListener("pointerdown", (event) => {
    const header = event.target.closest(".modal-head,.inspector-header");
    if (
      !header ||
      event.target.closest("button,input,select,a,[data-reset-window]") ||
      event.button !== 0
    )
      return;
    const element = header.closest("dialog,#inspector"),
      rect = element.getBoundingClientRect();
    drag = {
      element,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      style: element.getAttribute("style"),
      floating: element.hasAttribute("data-floating"),
    };
    element.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      move(
        drag.element,
        drag.left + event.clientX - drag.x,
        drag.top + event.clientY - drag.y,
      );
      event.preventDefault();
    },
    { passive: false },
  );
  function finish(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (event.type === "pointercancel") {
      if (drag.style === null) drag.element.removeAttribute("style");
      else drag.element.setAttribute("style", drag.style);
      drag.element.toggleAttribute("data-floating", drag.floating);
    }
    if (drag.element.hasPointerCapture(event.pointerId))
      drag.element.releasePointerCapture(event.pointerId);
    drag = null;
  }
  document.addEventListener("pointerup", finish);
  document.addEventListener("pointercancel", finish);
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reset-window]");
    if (button) resetWindow(button.closest("dialog,#inspector"));
  });
  document.addEventListener("keydown", (event) => {
    const header = event.target.closest(".modal-head,.inspector-header");
    if (
      !header ||
      !event.altKey ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    const element = header.closest("dialog,#inspector"),
      rect = element.getBoundingClientRect();
    if (event.key === "Home") resetWindow(element);
    else
      move(
        element,
        rect.left +
          (event.key === "ArrowLeft"
            ? -10
            : event.key === "ArrowRight"
              ? 10
              : 0),
        rect.top +
          (event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0),
      );
    event.preventDefault();
  });
  window.addEventListener("resize", () =>
    document.querySelectorAll("[data-floating]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      move(element, rect.left, rect.top);
    }),
  );
}
