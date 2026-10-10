import { pruneImageTargets, mediaTargetLabel } from "../model/image-regions.js";
import { esc } from "../core/dom.js";
import { sourceRecordLinks } from "../model/source-record-links.js";
import { unlinkProfileReferences } from "../model/profile-references.js";
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
  const source =
    kind === "document" && appState.project.documents.find((d) => d.id === id);
  const usages = source
    ? [
        ...source.people.map(
          (id) => appState.project.people.find((p) => p.id === id)?.name,
        ),
        ...sourceRecordLinks(appState.project, id).map(
          ({ profile, config }) => `${profile.name} · ${config.label}`,
        ),
        ...source.attachments.flatMap((file) =>
          (file.regions || []).flatMap((region) =>
            region.targets.map((target) =>
              mediaTargetLabel(appState.project, target),
            ),
          ),
        ),
      ].filter(Boolean)
    : [];
  const f = await openDialog(
    `${translate("ui.delete")} ` + labels[kind] + "?",
    `<p class="hint">${translate("ui.youCanUndoThisOnTheMapWhen")}</p>${usages.length ? `<p>${translate("ui.imageUsedIn")}</p><ul>${[...new Set(usages)].map((label) => `<li>${esc(label)}</li>`).join("")}</ul>` : ""}`,
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
      unlinkProfileReferences(appState.project, "person", [id]);
      unlinkProfileReferences(appState.project, "relationship", rs);
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
      unlinkProfileReferences(appState.project, "relationship", [id]);
      appState.project.relations = appState.project.relations.filter(
        (r) => r.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.relations = d.relations.filter((r) => r !== id)),
      );
    } else if (kind === "document") {
      unlinkProfileReferences(appState.project, "source", [id]);
      appState.project.property.forEach((a) =>
        unlinkPropertyReference(a, "source", id),
      );
      appState.project.documents = appState.project.documents.filter(
        (d) => d.id !== id,
      );
      appState.project.people.forEach((p) => {
        for (const key of ["bioSourceIds", "healthSourceIds"])
          p[key] = (p[key] || []).filter((x) => x !== id);
      });
    } else {
      appState.project.property = appState.project.property.filter(
        (a) => a.id !== id,
      );
      appState.project.documents.forEach(
        (d) => (d.propertyIds = (d.propertyIds || []).filter((x) => x !== id)),
      );
    }
    pruneImageTargets(appState.project);
    repairSelection();
  });
}
