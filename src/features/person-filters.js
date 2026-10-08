import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { clone, download, safeName, uid } from "../core/utils.js";
import {
  emptyPersonFilter,
  normalizePersonFilter,
} from "../core/person-filter-fields.js";
import {
  evaluatePersonFilter,
  personFilterCsv,
} from "../model/person-filters.js";
import { buildPersonFilterFacts } from "../model/person-filter-facts.js";
import { localDateString } from "../model/dates.js";
import { translate as t } from "../i18n/index.js";
import { commit } from "../services/history.js";
import { resetAnalysis } from "../graph/analysis.js";
import { fit, focusPerson } from "../graph/camera.js";
import { render, select } from "../ui/render.js";
import { openDialog, closeModal } from "../ui/dialog.js";
import { icons } from "../ui/icons.js";
import {
  renderPersonFilterForm,
  renderFilterRule,
  renderSavedPersonFilters,
  defaultFilterRule,
  quickPersonFilters,
} from "../ui/forms/person-filters.js";
import { renderPersonFilterResults } from "../ui/person-filter-results.js";
import {
  personFilterReport,
  resetPersonFilter,
} from "./person-filter-state.js";

export function renderPersonFilterBar() {
  const count = state.personFilter.rules.length;
  $("#personFilterCount").textContent = count || "";
  $('[data-action="person-filters"]').setAttribute(
    "aria-pressed",
    String(count > 0),
  );
  const bar = $("#personFilterBar");
  bar.hidden = !count;
  if (!count) {
    bar.innerHTML = "";
    return;
  }
  const report = personFilterReport();
  bar.innerHTML = `<span>${t("ui.filterActiveResults")} <b>${report.matches.length} / ${report.total}</b> · ${t("ui.filterConditionCount")} ${count}</span><div><button type="button" class="btn small" data-action="person-filters">${t("ui.edit")}</button><button type="button" class="btn small ghost" data-action="clear-person-filters">${t("ui.filterReset")}</button></div>${!report.matches.length ? `<p>${t("ui.filterNoMatches")}</p>` : ""}`;
}
function apply(query) {
  state.personFilter = query;
  resetAnalysis(false);
  state.multiSelection.clear();
  const ids = personFilterReport().ids;
  if (state.selected?.kind === "person" && !ids.has(state.selected.id))
    state.selected = null;
  render();
  fit();
}
export function clearPersonFilters() {
  resetPersonFilter();
  resetAnalysis(false);
  state.multiSelection.clear();
  render();
  fit();
}
export async function editPersonFilters() {
  let draft = clone(state.personFilter),
    applied = null,
    report = null,
    limit = 30,
    timer;
  const today = localDateString();
  let facts = buildPersonFilterFacts(state.project, today, state.blobs);
  const rawQuery = () => ({
    match: $("#personFilterMatch").value,
    sort: $("#personFilterSort").value,
    sortCurrency: $("#personFilterSortCurrency").value,
    rules: [...document.querySelectorAll("[data-filter-rule]")].map((row) => ({
      field: row.querySelector("[data-filter-field]").value,
      operator: row.querySelector("[data-filter-operator]").value,
      value: row.querySelector("[data-filter-value]")?.value || "",
      ...(row.querySelector("[data-filter-max]")
        ? { max: row.querySelector("[data-filter-max]").value }
        : {}),
      ...(row.querySelector("[data-filter-currency]")
        ? { currency: row.querySelector("[data-filter-currency]").value }
        : {}),
    })),
  });
  const preview = () => {
    clearTimeout(timer);
    if (!$("#personFilterEditor") || !$("#modal").open) return;
    draft = rawQuery();
    $("#filterSortCurrencyField").hidden = draft.sort !== "assetsDesc";
    try {
      report = evaluatePersonFilter(state.project, draft, {
        today,
        files: state.blobs,
        groupId: state.groupFilter,
        facts,
      });
      $("#filterEditorError").textContent = "";
      $("#personFilterResults").innerHTML = renderPersonFilterResults(
        report,
        limit,
      );
    } catch {
      report = null;
      $("#filterEditorError").textContent = t("ui.filterInvalidCondition");
      $("#personFilterResults").innerHTML = "";
    }
  };
  const rows = () => {
    $("#personFilterRules").innerHTML = draft.rules
      .map((r, i) => renderFilterRule(r, i, state.project))
      .join("");
    $("#personFilterMatch").value = draft.match;
    $("#personFilterSort").value = draft.sort;
    $("#personFilterSortCurrency").value = draft.sortCurrency;
    limit = 30;
    icons();
    preview();
  };
  const result = await openDialog(
    t("ui.personFilters"),
    renderPersonFilterForm(draft, state.project, facts),
    {
      wide: true,
      submit: t("ui.filterApply"),
      validate: () => {
        try {
          applied = normalizePersonFilter(rawQuery());
          return "";
        } catch {
          return t("ui.filterInvalidCondition");
        }
      },
      onOpen: () => {
        const editor = $("#personFilterEditor");
        editor.addEventListener("input", () => {
          clearTimeout(timer);
          timer = setTimeout(preview, 180);
        });
        editor.addEventListener("change", (event) => {
          const target = event.target;
          if (target.id === "savedPersonFilter") {
            const view = (state.project.personFilterViews || []).find(
              (v) => v.id === target.value,
            );
            if (view) {
              draft = clone(view.query);
              $("#personFilterName").value = view.name;
              rows();
            }
            $("[data-filter-command='delete']").disabled = !view;
            return;
          }
          draft = rawQuery();
          const row = target.closest("[data-filter-rule]");
          if (target.matches("[data-filter-field]"))
            draft.rules[Number(row.dataset.filterRule)] = defaultFilterRule(
              target.value,
              state.project,
            );
          if (
            target.matches("[data-filter-operator]") &&
            target.value === "between"
          ) {
            const rule = draft.rules[Number(row.dataset.filterRule)];
            rule.max = rule.value || "0";
          }
          if (target.matches("[data-filter-field],[data-filter-operator]"))
            rows();
          else preview();
        });
        editor.addEventListener("click", (event) => {
          const button = event.target.closest("[data-filter-command]");
          if (!button) return;
          event.preventDefault();
          const command = button.dataset.filterCommand;
          draft = rawQuery();
          if (command === "add" || command === "quick") {
            const preset = quickPersonFilters.find(
              ([key]) => key === button.dataset.preset,
            )?.[2];
            if (
              draft.rules.length >= 20 &&
              (command === "add" ||
                !draft.rules.some((r) => r.field === preset.field))
            ) {
              $("#filterEditorError").textContent = t("ui.filterRuleLimit");
              return;
            }
            if (command === "add")
              draft.rules.push(defaultFilterRule("life", state.project));
            else {
              draft.rules = [
                ...draft.rules.filter((r) => r.field !== preset.field),
                clone(preset),
              ];
            }
            rows();
          } else if (command === "remove") {
            draft.rules.splice(Number(button.dataset.index), 1);
            rows();
          } else if (command === "clear") {
            draft = emptyPersonFilter();
            rows();
          } else if (command === "more") {
            limit += 30;
            preview();
          } else if (command === "csv") {
            preview();
            if (report)
              download(
                new Blob([personFilterCsv(report, today)], {
                  type: "text/csv;charset=utf-8",
                }),
                safeName(state.project.title) + "-people.csv",
              );
          } else if (command === "person") {
            preview();
            if (!report) return;
            const query = report.query;
            closeModal();
            apply(query);
            select("person", button.dataset.id);
            focusPerson(button.dataset.id);
          } else if (command === "save") {
            preview();
            const name = $("#personFilterName").value.trim();
            if (!report || !name) {
              $("#filterEditorError").textContent = t("ui.filterNameRequired");
              return;
            }
            const oldId = $("#savedPersonFilter").value;
            if (
              !oldId &&
              (state.project.personFilterViews || []).length >= 20
            ) {
              $("#filterEditorError").textContent = t("ui.filterViewLimit");
              return;
            }
            const view = { id: oldId || uid(), name, query: report.query };
            commit(() => {
              state.project.personFilterViews = [
                ...(state.project.personFilterViews || []).filter(
                  (v) => v.id !== view.id,
                ),
                view,
              ];
            });
            $("#filterSavedControls").innerHTML = renderSavedPersonFilters(
              state.project,
              view.id,
              name,
            );
            icons();
          } else if (command === "delete") {
            const id = $("#savedPersonFilter").value;
            commit(() => {
              state.project.personFilterViews =
                state.project.personFilterViews.filter((v) => v.id !== id);
            });
            facts = buildPersonFilterFacts(state.project, today, state.blobs);
            $("#filterSavedControls").innerHTML = renderSavedPersonFilters(
              state.project,
            );
            icons();
          }
        });
        preview();
      },
    },
  );
  clearTimeout(timer);
  if (result && applied) apply(applied);
}
