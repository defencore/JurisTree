import { propertyMetadataFields } from "../core/property-records.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { asset } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { openDialog } from "../ui/dialog.js";
import { renderPropertyForm } from "../ui/forms/property.js";

export async function editProperty(id = null, ownerId = "") {
  const a = id
    ? asset(id)
    : {
        title: "",
        ownerId,
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
        if (
          f.get("currency") &&
          !/^[A-Z]{3}$/.test(f.get("currency").trim().toUpperCase())
        )
          return translate("ui.propertyCurrencyError");
        if (f.get("value") && !f.get("currency").trim())
          return translate("ui.propertyCurrencyError");
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
      currency: f.get("currency").trim().toUpperCase(),
      ...Object.fromEntries(
        propertyMetadataFields().map((key) => [
          key,
          String(f.get(key) || "").trim(),
        ]),
      ),
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
        rights: [],
        transfers: [],
        claims: [],
      });
  });
}
