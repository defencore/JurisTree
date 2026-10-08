import { startTemplate } from "./templates/start.js";
import { workspaceTemplate } from "./templates/workspace.js";
import { dialogsTemplate } from "./templates/dialogs.js";
import { getLanguage, translate } from "../i18n/index.js";
const template = [startTemplate, workspaceTemplate, dialogsTemplate].join("\n");
const bindings = [];
const marker = /@@([\w.]+)@@/g;
export function mountShell() {
  document.body.innerHTML = template;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.includes("@@"))
      bindings.push({
        node,
        source: node.textContent,
      });
  }
  for (const node of document.querySelectorAll("*")) {
    for (const attribute of node.attributes) {
      if (attribute.value.includes("@@"))
        bindings.push({
          node,
          attribute: attribute.name,
          source: attribute.value,
        });
    }
  }
}

/** Update only static shell messages; editable project values are preserved. */
export function localizeShell() {
  for (const binding of bindings) {
    const { node, attribute, source } = binding;
    if (!node.isConnected) continue;
    const value = source.replace(marker, (_, key) => translate(key));
    if (attribute) {
      if (
        attribute === "value" &&
        node.value !== binding.previous &&
        binding.previous !== undefined
      )
        continue;
      node.setAttribute(attribute, value);
      if (attribute === "value") node.value = value;
    } else node.textContent = value;
    binding.previous = value;
  }
  for (const select of document.querySelectorAll("[data-language]"))
    select.value = getLanguage();
  for (const label of document.querySelectorAll("[data-language-label]"))
    label.textContent = translate("ui.language");
  document.documentElement.lang = getLanguage();
}
