import { $, esc } from "../core/dom.js";
import { propertyRecordConfigs } from "../core/property-records.js";
import { state } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate as t } from "../i18n/index.js";
import { propertyRecordError } from "../model/property-records.js";
import { asset } from "../model/project.js";
import { commit } from "../services/history.js";
import { openDialog, toast } from "../ui/dialog.js";
import {
  collectPropertyRecord,
  propertyRecordForm,
} from "../ui/forms/property-record.js";
import { render } from "../ui/render.js";

export function openPropertyHistory(id) {
  if (!asset(id)) return;
  state.propertyFocus = id;
  state.view = "property";
  render();
  $("#otherView").scrollTop = 0;
}
export async function editPropertyRecord(propertyId, kind, id = null) {
  const item = asset(propertyId),
    cfg = propertyRecordConfigs()[kind];
  if (!item || !cfg) return;
  if (!id && (item[kind] || []).length >= 200)
    return toast(t("ui.tooManyProfileRecords"));
  const old = id ? (item[kind] || []).find((r) => r.id === id) : {};
  if (!old) return;
  state.propertyFocus = propertyId;
  const form = await openDialog(
    `${cfg.label} · ${item.title}`,
    propertyRecordForm(kind, old, id),
    {
      wide: true,
      validate: (form) =>
        propertyRecordError(kind, collectPropertyRecord(form, kind)),
    },
  );
  if (!form) return;
  const record = { id: id || uid(), ...collectPropertyRecord(form, kind) };
  commit(() => {
    item[kind] ??= [];
    if (id) Object.assign(old, record);
    else item[kind].push(record);
  });
}
export async function deletePropertyRecord(kind, id) {
  const item = asset(state.propertyFocus),
    cfg = propertyRecordConfigs()[kind];
  if (!item || !cfg || !(item[kind] || []).some((r) => r.id === id)) return;
  const form = await openDialog(
    t("ui.deleteRecord"),
    `<p>${esc(item.title)} · ${esc(cfg.label)}</p><p class="hint">${t("ui.youCanUndoThisOnTheMapWhen")}</p>`,
    { submit: t("ui.delete") },
  );
  if (form)
    commit(() => {
      item[kind] = item[kind].filter((r) => r.id !== id);
    });
}
export function closePropertyHistory() {
  state.propertyFocus = "";
  render();
  $("#propertySearch")?.focus();
}
