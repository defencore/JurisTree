import { esc } from "../core/dom.js";
import { translate } from "../i18n/index.js";
import {
  dateExact,
  dateInputValue,
  displayDate,
  partialDate,
} from "../model/dates.js";
import { icon } from "./icons.js";

const formats = {
  day: ["ui.datePrecisionDay", "DD.MM.YYYY"],
  month: ["ui.datePrecisionMonth", "MM.YYYY"],
  year: ["ui.datePrecisionYear", "YYYY"],
  approximate: ["ui.datePrecisionApproximate", "≈ 1980"],
  range: ["ui.datePrecisionRange", "1980 – 1985"],
};
const precisionOf = (date) =>
  date?.approximate ? "approximate" : date?.precision || "day";

/** Structured uncertainty shares one named value with exact dates and the native calendar. */
export function dateInput(
  name,
  value = "",
  { id = "", period = false, freeText = false } = {},
) {
  const exact = dateExact(value),
    mode = freeText ? "text" : period ? "period" : "exact",
    precision = precisionOf(partialDate(value)),
    options = period
      ? `<span class="date-precision-controls"><select data-date-precision aria-label="${esc(translate("ui.datePrecision"))}">${Object.entries(
          formats,
        )
          .map(
            ([key, [label]]) =>
              `<option value="${key}" ${key === precision ? "selected" : ""}>${esc(translate(label))}</option>`,
          )
          .join(
            "",
          )}</select><small data-date-format>${esc(formats[precision][1])}</small></span>`
      : "";
  return `<span class="date-input-control"><input type="text" ${name ? `name="${esc(name)}"` : ""} ${id ? `id="${esc(id)}"` : ""} data-date-input="${mode}" value="${esc(displayDate(period || freeText ? value : exact))}" placeholder="${freeText ? esc(translate("ui.dateFormats")) : period ? formats[precision][1] : "DD.MM.YYYY"}" maxlength="${freeText ? 60 : period ? 48 : 10}" inputmode="${freeText || period ? "text" : "decimal"}" autocomplete="off"><span class="date-picker-control">${icon("calendar")}<input type="date" data-date-picker aria-label="${esc(translate("ui.chooseDate"))}" value="${exact}" min="0001-01-01" max="9999-12-31"></span>${options}</span>`;
}

function updatePrecision(control, precision) {
  const select = control.querySelector("[data-date-precision]");
  if (!select) return;
  select.value = precision;
  control.querySelector("[data-date-input]").placeholder =
    formats[precision][1];
  control.querySelector("[data-date-format]").textContent =
    formats[precision][1];
}

function synchronize(input, update = true) {
  let value = dateInputValue(input.value),
    parsed = partialDate(value);
  const mode = input.dataset.dateInput,
    control = input.closest(".date-input-control");
  if (
    control.querySelector("[data-date-precision]")?.value === "approximate" &&
    parsed &&
    !parsed.approximate &&
    parsed.precision !== "range"
  ) {
    value = "~" + value;
    parsed = partialDate(value);
    input.value = displayDate(value);
  }
  input.setCustomValidity(
    !value || mode === "text" || (mode === "period" ? parsed : dateExact(value))
      ? ""
      : `${translate("ui.invalidProfileDate")} ${mode === "period" ? translate("ui.dateFormats") : "DD.MM.YYYY"}`,
  );
  control.querySelector("[data-date-picker]").value = dateExact(value);
  if (update && parsed) updatePrecision(control, precisionOf(parsed));
  return value;
}

export function bindDateInputEvents() {
  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-date-input]")) synchronize(event.target);
  });
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-date-precision]")) {
      const control = target.closest(".date-input-control"),
        input = control.querySelector("[data-date-input]"),
        value = dateInputValue(input.value),
        parsed = partialDate(value),
        precision = target.value,
        atom = value.replace(/^~/, "");
      if (parsed && parsed.precision !== "range") {
        if (precision === "year") input.value = atom.slice(0, 4);
        else if (precision === "month" && atom.length >= 7)
          input.value = displayDate(atom.slice(0, 7));
        else if (precision === "approximate")
          input.value = displayDate("~" + atom);
        else if (precision === "range") input.value = displayDate(atom) + " – ";
        else if (precision === "day") input.value = displayDate(atom);
      }
      updatePrecision(control, precision);
      synchronize(input, false);
      input.focus();
    } else if (target.matches("[data-date-picker]")) {
      const input = target
        .closest(".date-input-control")
        .querySelector("[data-date-input]");
      input.value = displayDate(target.value);
      updatePrecision(input.closest(".date-input-control"), "day");
      synchronize(input);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (target.matches("[data-date-input]"))
      target.value = displayDate(synchronize(target));
  });
  document.addEventListener("focusout", (event) => {
    if (event.target.matches("[data-date-input]"))
      event.target.value = displayDate(synchronize(event.target));
  });
  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-date-picker]") && event.target.showPicker) {
      try {
        event.target.showPicker();
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
      }
    }
  });
  document.addEventListener(
    "formdata",
    (event) => {
      const names = new Set(
        [...event.target.querySelectorAll("[data-date-input][name]")].map(
          (input) => input.name,
        ),
      );
      for (const name of names) {
        const values = event.formData.getAll(name).map(dateInputValue);
        event.formData.delete(name);
        for (const value of values) event.formData.append(name, value);
      }
    },
    true,
  );
}
