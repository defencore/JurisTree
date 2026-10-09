import { esc } from "../core/dom.js";
import { translate } from "../i18n/index.js";
import {
  dateExact,
  dateInputValue,
  displayDate,
  partialDate,
} from "../model/dates.js";
import { icon } from "./icons.js";

/** One visible date format, with the browser calendar retained as an input method. */
export function dateInput(
  name,
  value = "",
  { id = "", period = false, freeText = false } = {},
) {
  const exact = dateExact(value),
    mode = freeText ? "text" : period ? "period" : "exact";
  return `<span class="date-input-control"><input type="text" ${name ? `name="${esc(name)}"` : ""} ${id ? `id="${esc(id)}"` : ""} data-date-input="${mode}" value="${esc(displayDate(period || freeText ? value : exact))}" placeholder="${period || freeText ? esc(translate("ui.yearOrDayMonthYear")) : "DD.MM.YYYY"}" maxlength="${freeText ? 60 : 10}" inputmode="${freeText ? "text" : "decimal"}" autocomplete="off"><span class="date-picker-control">${icon("calendar")}<input type="date" data-date-picker aria-label="${esc(translate("ui.chooseDate"))}" value="${exact}" min="0001-01-01" max="9999-12-31"></span></span>`;
}

function synchronize(input) {
  const value = dateInputValue(input.value),
    mode = input.dataset.dateInput;
  input.setCustomValidity(
    !value ||
      mode === "text" ||
      (mode === "period" ? partialDate(value) : dateExact(value))
      ? ""
      : `${translate("ui.invalidProfileDate")} ${mode === "period" ? translate("ui.yearOrDayMonthYear") : "DD.MM.YYYY"}`,
  );
  input
    .closest(".date-input-control")
    .querySelector("[data-date-picker]").value = dateExact(value);
  return value;
}

export function bindDateInputEvents() {
  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-date-input]")) synchronize(event.target);
  });
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-date-picker]")) {
      const input = target
        .closest(".date-input-control")
        .querySelector("[data-date-input]");
      input.value = displayDate(target.value);
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
