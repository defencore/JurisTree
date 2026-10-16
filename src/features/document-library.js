import { documentCategories, documentTypes } from "../core/document-catalog.js";
import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import {
  documentSupportsRecord,
  MAX_DOCUMENT_RECORD_LINKS,
} from "../model/document-links.js";
import { documentReference } from "../model/document-details.js";
import { matchingDocuments } from "../model/document-library.js";
import { displayDate } from "../model/dates.js";
import {
  recordSources,
  profileRecordTarget,
} from "../model/source-record-links.js";
import { sourcePeopleIds } from "../model/image-regions.js";
import { commit } from "../services/history.js";
import { documentIcon, typeOptions } from "../ui/components.js";
import { openDialog, toast } from "../ui/dialog.js";
import { icon, icons } from "../ui/icons.js";

/** Reuse the source itself, including PDFs and unscanned document records. */
export async function selectLibraryDocument(target) {
  if (
    target.recordId
      ? !profileRecordTarget(state.project, target)
      : !state.project.people.some((person) => person.id === target.personId)
  )
    return;
  const linked = new Set(
    target.recordId
      ? recordSources(state.project, target).map((source) => source.id)
      : state.project.documents
          .filter((source) =>
            sourcePeopleIds(state.project, source).includes(target.personId),
          )
          .map((source) => source.id),
  );
  let chosen = [];
  const controller = new AbortController();
  const result = await openDialog(
    t("ui.documentChooseExisting"),
    `<p class="hint">${t("ui.documentChooseHint")}</p><div class="form-grid"><label class="field">${t("ui.search")}<input type="search" data-document-library-query autocomplete="off"></label><label class="field">${t("ui.documentCategory")}<select data-document-library-category><option value="">${t("ui.documentAllCategories")}</option>${typeOptions(documentCategories(), "")}</select></label></div><p class="hint" data-document-library-selected role="status"></p><div data-document-library-items></div>`,
    {
      wide: true,
      kind: "document-picker",
      validate: (form) => {
        chosen = form.getAll("libraryDocuments");
        if (!chosen.length) return t("ui.documentChooseHint");
        if (
          target.recordId &&
          chosen.some(
            (id) =>
              state.project.documents.find((source) => source.id === id)
                ?.recordLinks?.length >= MAX_DOCUMENT_RECORD_LINKS,
          )
        )
          return t("ui.documentInvalidLinks");
        return "";
      },
      onOpen: () => {
        const root = $("#modalContent"),
          selected = new Set();
        const query = root.querySelector("[data-document-library-query]"),
          category = root.querySelector("[data-document-library-category]"),
          list = root.querySelector("[data-document-library-items]");
        function selectionCount() {
          root.querySelector("[data-document-library-selected]").textContent =
            `${t("ui.selected")}: ${selected.size}`;
        }
        function render() {
          const sources = matchingDocuments(
            state.project,
            query.value,
            category.value,
          );
          list.innerHTML = `<div class="document-picker-list">${sources.map((source) => `<label class="document-picker-item"><input type="checkbox" name="libraryDocuments" value="${esc(source.id)}" ${linked.has(source.id) ? "disabled checked" : selected.has(source.id) ? "checked" : ""}>${icon(documentIcon(source))}<span><b>${esc(source.title)}</b><small>${esc([documentTypes()[source.type], documentReference(source), displayDate(source.date)].filter(Boolean).join(" · "))}</small>${linked.has(source.id) ? `<small>${t("ui.documentAlreadyLinked")}</small>` : ""}</span></label>`).join("")}</div>${sources.length ? "" : `<p class="hint">${t("ui.documentNoMatches")}</p>`}`;
          // Selected sources remain in the submission when a search hides them.
          for (const id of selected)
            if (!sources.some((source) => source.id === id)) {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = "libraryDocuments";
              input.value = id;
              list.append(input);
            }
          selectionCount();
          icons();
        }
        query.addEventListener("input", render, { signal: controller.signal });
        query.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape" && query.value) {
              event.preventDefault();
              event.stopPropagation();
              query.value = "";
              render();
            }
          },
          { signal: controller.signal },
        );
        category.addEventListener("change", render, {
          signal: controller.signal,
        });
        list.addEventListener(
          "change",
          (event) => {
            if (event.target.name === "libraryDocuments") {
              if (event.target.checked) selected.add(event.target.value);
              else selected.delete(event.target.value);
              selectionCount();
            }
          },
          { signal: controller.signal },
        );
        render();
      },
    },
  );
  controller.abort();
  if (!result) return;
  commit(() => {
    for (const source of state.project.documents.filter((source) =>
      chosen.includes(source.id),
    )) {
      if (target.recordId) {
        source.recordLinks ||= [];
        if (!documentSupportsRecord(source, target))
          source.recordLinks.push({
            personId: target.personId,
            section: target.section,
            recordId: target.recordId,
          });
      } else if (!source.people.includes(target.personId))
        source.people.push(target.personId);
    }
  });
  toast(t("ui.documentLinkSaved"));
}
