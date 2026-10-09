import { recordConfigs } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { unlinkPropertyReference } from "../model/property-records.js";
import { commit, repairSelection } from "../services/history.js";
import { closeModal, openDialog } from "../ui/dialog.js";

export async function confirmDelete(kind, id) {
  closeModal();
  const labels = {
    person: translate("ui.thePersonAndTheirRelationships"),
    relation: translate("ui.theRelationship"),
    document: translate("ui.theDocument"),
    property: translate("ui.theProperty"),
  };
  const f = await openDialog(
    `${translate("ui.delete")} ` + labels[kind] + "?",
    `<p class="hint">${translate("ui.youCanUndoThisOnTheMapWhen")}</p>`,
    {
      submit: translate("ui.delete"),
    },
  );
  if (!f) return;
  commit(() => {
    if (kind === "person") {
      const deletedName = appState.project.people.find(
        (p) => p.id === id,
      )?.name;
      appState.project.people = appState.project.people.filter(
        (p) => p.id !== id,
      );
      const rs = appState.project.relations
        .filter((r) => r.from === id || r.to === id)
        .map((r) => r.id);
      for (const p of appState.project.people)
        for (const cfg of Object.values(recordConfigs()))
          for (const record of p[cfg.key] || [])
            for (const [key, , type] of cfg.fields)
              if (type === "person" && record[key] === id) record[key] = "";
      appState.project.relations = appState.project.relations.filter(
        (r) => !rs.includes(r.id),
      );
      appState.project.documents.forEach((d) => {
        d.people = d.people.filter((p) => p !== id);
        if (Array.isArray(d.subjectIds))
          d.subjectIds = d.subjectIds.filter((x) => x !== id);
        d.relations = d.relations.filter((r) => !rs.includes(r));
      });
      appState.project.property.forEach((a) => {
        unlinkPropertyReference(a, "person", id, deletedName);
        if (a.ownerId === id) a.ownerId = "";
        a.allocations = a.allocations.filter((x) => x.personId !== id);
      });
      if (appState.project.subjectId === id) appState.project.subjectId = "";
      if (appState.project.claimantId === id) appState.project.claimantId = "";
    } else if (kind === "relation") {
      appState.project.relations = appState.project.relations.filter(
        (r) => r.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.relations = d.relations.filter((r) => r !== id)),
      );
    } else if (kind === "document") {
      appState.project.property.forEach((a) =>
        unlinkPropertyReference(a, "source", id),
      );
      appState.project.documents = appState.project.documents.filter(
        (d) => d.id !== id,
      );
      appState.project.people.forEach((p) => {
        for (const key of ["bioSourceIds", "healthSourceIds"])
          p[key] = (p[key] || []).filter((x) => x !== id);
        for (const cfg of Object.values(recordConfigs()))
          for (const r of p[cfg.key] || [])
            if (r.sourceId === id) r.sourceId = "";
      });
    } else {
      appState.project.property = appState.project.property.filter(
        (a) => a.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.propertyIds = (d.propertyIds || []).filter((x) => x !== id)),
      );
    }
    repairSelection();
  });
}
