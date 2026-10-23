import { $ } from "../core/dom.js";

/** Reuse the same search controls in the header when there is enough room. */
export function bindWorkspaceHeader() {
  const search = $("#globalSearchBar"),
    slot = $("#headerSearchSlot"),
    header = $("#appShell .topbar"),
    home = document.createComment("Search row for narrow and touch layouts"),
    desktop = matchMedia("(min-width: 1200px) and (pointer: fine)");
  search.before(home);
  const update = () => {
    const focused = search.contains(document.activeElement)
      ? document.activeElement
      : null;
    if (desktop.matches) slot.append(search);
    else home.after(search);
    document.body.classList.toggle("inline-workspace-search", desktop.matches);
    focused?.focus({ preventScroll: true });
    measure();
  };
  const measure = () => {
    const bottom = Math.max(
      header.getBoundingClientRect().bottom,
      search.getBoundingClientRect().bottom,
    );
    document.documentElement.style.setProperty(
      "--workspace-header-height",
      `${bottom}px`,
    );
  };
  const observer = new ResizeObserver(measure);
  observer.observe(header);
  observer.observe(search);
  update();
  desktop.addEventListener("change", update);
}
