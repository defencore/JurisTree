import { esc } from "../core/dom.js";
import {
  profileCatalog,
  profileSectionCount,
} from "../core/profile-catalog.js";
import { getLocale, translate as t } from "../i18n/index.js";
import { icon } from "./icons.js";

export function profileNavigation(person, extra = []) {
  const groups = [
    { label: t("ui.profileOverview"), sections: extra },
    ...profileCatalog(),
  ].filter((group) => group.sections.length);
  const extraKeys = new Set(extra.map(({ key }) => key));
  return `<aside class="profile-navigation"><label class="profile-section-search">${icon("search")}<input type="search" data-profile-search placeholder="${t("ui.findProfileSection")}" aria-label="${t("ui.findProfileSection")}"></label><label class="profile-section-picker">${t("ui.profileSections")}<select data-profile-picker><option value="">${t("ui.jumpToSection")}</option>${groups.map((group) => `<optgroup label="${esc(group.label)}">${group.sections.map((section) => `<option value="${section.key}">${esc(section.label)}</option>`).join("")}</optgroup>`).join("")}</select></label><nav aria-label="${t("ui.profileSections")}">${groups.map((group) => `<div data-profile-nav-group><p>${esc(group.label)}</p>${group.sections.map((section) => `<button type="button" data-profile-target="${section.key}">${icon(section.icon)}<span>${esc(section.label)}</span>${extraKeys.has(section.key) ? "" : `<b data-profile-count="${section.key}">${profileSectionCount(person, section.key) || ""}</b>`}</button>`).join("")}</div>`).join("")}</nav><p class="hint profile-navigation-hint">${t("ui.profileNavigationHint")}</p></aside>`;
}

function reveal(panel) {
  for (let element = panel; element; element = element.parentElement)
    if (element.tagName === "DETAILS") element.open = true;
}

/** Filter the existing DOM so changing sections never discards unsaved fields. */
export function bindProfileNavigation(root) {
  if (!root) return;
  const search = root.querySelector("[data-profile-search]");
  const picker = root.querySelector("[data-profile-picker]");
  const panels = [...root.querySelectorAll("[data-profile-panel]")];
  const buttons = [...root.querySelectorAll("[data-profile-target]")];
  const filter = () => {
    const terms = search.value
      .toLocaleLowerCase(getLocale())
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const matches = new Set();
    for (const panel of panels) {
      const text = (
        panel.dataset.profileKeywords || panel.textContent
      ).toLocaleLowerCase(getLocale());
      panel.hidden = !terms.every((term) => text.includes(term));
      if (!panel.hidden) matches.add(panel.dataset.profilePanel);
    }
    buttons.forEach((button) => {
      button.hidden = !matches.has(button.dataset.profileTarget);
    });
    root.querySelectorAll("[data-profile-category]").forEach((group) => {
      group.hidden = ![...group.querySelectorAll("[data-profile-panel]")].some(
        (panel) => !panel.hidden,
      );
    });
    root.querySelectorAll("[data-profile-nav-group]").forEach((group) => {
      group.hidden = ![...group.querySelectorAll("button")].some(
        (button) => !button.hidden,
      );
    });
    for (const option of picker.options)
      if (option.value) option.hidden = !matches.has(option.value);
    const empty = root.querySelector("[data-profile-no-results]");
    if (empty) empty.hidden = matches.size > 0;
  };
  const jump = (key, focus = true) => {
    const panel = panels.find((panel) => panel.dataset.profilePanel === key);
    if (!panel) return;
    if (panel.hidden) {
      search.value = "";
      filter();
    }
    reveal(panel);
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-current",
        String(button.dataset.profileTarget === key),
      ),
    );
    picker.value = key;
    panel.scrollIntoView({ block: "start", behavior: "instant" });
    if (focus)
      (
        panel.querySelector(
          "summary,input:not([type=hidden]),textarea,select,button",
        ) || panel
      ).focus({ preventScroll: true });
  };
  search.addEventListener("input", filter);
  picker.addEventListener("change", () => jump(picker.value));
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-target]");
    if (!button) return;
    event.preventDefault();
    jump(button.dataset.profileTarget);
  });
  root.addEventListener(
    "invalid",
    (event) => {
      const panel = event.target.closest("[data-profile-panel]");
      if (panel) {
        reveal(event.target);
        jump(panel.dataset.profilePanel, false);
      }
    },
    true,
  );
  root.profileJump = jump;
}

export function updateProfileCounts() {
  const root = document.querySelector("[data-profile-editor]");
  if (!root) return;
  for (const panel of root.querySelectorAll("[data-profile-section]")) {
    const key = panel.dataset.profileSection;
    const count = panel.querySelector(`#records-${key}`)
      ? panel.querySelectorAll("[data-record-section]").length
      : Number(
          [...panel.querySelectorAll("textarea")].some((input) =>
            input.value.trim(),
          ),
        );
    for (const label of root.querySelectorAll(
      `[data-profile-count="${key}"], [data-section-count="${key}"]`,
    ))
      label.textContent = count || "";
  }
}
