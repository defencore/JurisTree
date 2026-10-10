import { workspaceViews } from "../../core/workspace-views.js";

export function workspaceNavigation() {
  return `<nav class="nav" aria-label="@@ui.workspaceSections@@">${[
    ...new Set(workspaceViews.map((view) => view.group)),
  ]
    .map(
      (group) =>
        `<div class="nav-group"><p class="section-label nav-label">@@${group}@@</p>${workspaceViews
          .filter((view) => view.group === group)
          .map(
            (view) =>
              `<button class="navbtn" data-view="${view.key}" aria-label="@@${view.title}@@" title="@@${view.title}@@"><span class="nav-icon"><i data-icon="${view.icon}"></i></span><span class="nav-text"><b>@@${view.title}@@</b><small>@@${view.hint}@@</small></span>${view.count ? `<span class="count ${view.key === "gaps" ? "warning" : ""}" id="${view.count}"></span>` : ""}</button>`,
          )
          .join("")}</div>`,
    )
    .join("")}</nav>`;
}
