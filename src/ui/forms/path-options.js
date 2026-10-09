import { translate } from "../../i18n/index.js";

export function pathDepthOptions(mode = "shortest", value = 600) {
  return [2, 4, 6, 8, 12, ...(mode === "shortest" ? [600] : [])]
    .map(
      (n) =>
        `<option value="${n}" ${n === value ? "selected" : ""}>${n === 600 ? translate("ui.unlimited") : n}</option>`,
    )
    .join("");
}
