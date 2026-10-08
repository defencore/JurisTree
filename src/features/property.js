import { renderPropertyForm } from "../ui/forms/property.js";
import { getLocale } from "../i18n/index.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { linkedDocs } from "../model/evidence.js";
import { asset, person } from "../model/project.js";
import { commit } from "../services/history.js";
import { personOptions } from "../ui/components.js";
import { openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
export function renderProperty() {
  $("#otherView").innerHTML =
    `<div class="intro-line"><div><h2>${translate("ui.propertyAndPlannedAllocation")}</h2><p>${translate("ui.keepPropertyDetailsOwnershipDocumentsAndPlannedFamily")}</p></div></div><div class="banner">${translate("ui.youEnterTheSharesThisPlanDoesNot")}</div>${
      appState.project.property
        .map((a) => {
          const total = (a.allocations || []).reduce(
            (s, x) => s + Number(x.percent),
            0,
          );
          return `<div class="asset-card"><div class="asset-head"><span class="avatar">${icon("home")}</span><div><h3>${esc(a.title)}</h3><p>${esc(person(a.ownerId)?.name || translate("ui.noOwnerSelected"))} · ${a.value ? new Intl.NumberFormat(getLocale()).format(a.value) + " " + esc(a.currency) : translate("ui.noValuation")}</p></div><button class="btn small" data-edit-property="${a.id}">${icon("edit")}</button></div>${(
            a.allocations || []
          )
            .map(
              (x) =>
                `<div class="allocation"><span>${esc(person(x.personId)?.name || translate("ui.personDeleted"))}</span><b>${x.percent}%${
                  a.value
                    ? " · " +
                      new Intl.NumberFormat(getLocale(), {
                        maximumFractionDigits: 2,
                      }).format((Number(a.value) * x.percent) / 100) +
                      " " +
                      esc(a.currency)
                    : ""
                }</b></div>`,
            )
            .join(
              "",
            )}<div class="asset-total ${Math.abs(total - 100) > 0.001 ? "bad" : ""}"><span>${total > 100 ? translate("ui.overallocated") : total < 100 ? translate("ui.unallocated") : translate("ui.allocated")}</span><b>${Math.abs(total - 100) > 0.001 ? Math.abs(100 - total).toFixed(2) + "%" : "100%"}</b></div>${a.notes ? `<p class="hint">${esc(a.notes)}</p>` : ""}<button class="btn small ghost" data-asset-doc="${a.id}" style="margin-top:10px">${icon("file")}${translate("ui.ownershipDocument")}${linkedDocs("property", a.id).length})</button></div>`;
        })
        .join("") ||
      `<div class="empty">${icon("home")}<h2>${translate("ui.addFamilyProperty")}</h2><p>${translate("ui.forExampleAHouseLandBankDepositOr")}</p><button class="btn primary" data-action="add-property">${translate("ui.addProperty")}</button></div>`
    }`;
}
export function allocationRow(
  a = {
    personId: appState.project.people[0]?.id,
    percent: "",
  },
) {
  return `<div class="allocation-editor"><select name="allocation-person">${personOptions(a.personId)}</select><input type="number" name="allocation-percent" min="0" max="100" step="0.01" value="${esc(a.percent)}" placeholder="%" aria-label="${translate("ui.percentageShare")}"><button type="button" class="iconbtn" data-remove-allocation aria-label="${translate("ui.removeShare")}">${icon("x")}</button></div>`;
}
export async function editProperty(id = null) {
  const a = id
    ? asset(id)
    : {
        title: "",
        ownerId: "",
        value: "",
        currency: "USD",
        notes: "",
        allocations: [],
      };
  const f = await openDialog(
    id ? translate("ui.editProperty") : translate("ui.addProperty"),
    renderPropertyForm(a, id),
    {
      validate: (f) => {
        if (!f.get("title").trim()) return translate("ui.enterATitle");
        const ids = f.getAll("allocation-person"),
          vs = f.getAll("allocation-percent").map(Number);
        if (ids.length !== new Set(ids).size)
          return translate("ui.eachPersonCanAppearInTheAllocationOnly");
        if (vs.some((v) => !Number.isFinite(v) || v < 0 || v > 100))
          return translate("ui.sharesMustBeBetween0And100");
        if (vs.reduce((s, x) => s + x, 0) > 100.001)
          return translate("ui.totalSharesExceed100");
        return "";
      },
    },
  );
  if (!f) return;
  commit(() => {
    const data = {
      title: f.get("title").trim(),
      ownerId: f.get("ownerId"),
      value: f.get("value") ? Number(f.get("value")) : "",
      currency: f.get("currency"),
      notes: f.get("notes"),
      allocations: f.getAll("allocation-person").map((personId, i) => ({
        personId,
        percent: Number(f.getAll("allocation-percent")[i]),
      })),
    };
    if (id) Object.assign(a, data);
    else
      appState.project.property.push({
        id: uid(),
        x: 670,
        y: 50 + appState.project.property.length * 160,
        ...data,
      });
  });
}
