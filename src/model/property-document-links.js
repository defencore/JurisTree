import { propertyRecordConfigs } from "../core/property-records.js";
import { translate as t } from "../i18n/index.js";

export const propertyDocumentKey = (link) =>
  [link.propertyId, link.kind, link.recordId].join(":");
export function normalizePropertyDocumentLinks(value = []) {
  if (!Array.isArray(value) || value.length > 500)
    throw Error(t("ui.documentInvalidLinks"));
  const links = new Map();
  for (const link of value) {
    if (
      !link ||
      !["propertyId", "kind", "recordId"].every(
        (key) =>
          typeof link[key] === "string" && /^[\w-]{1,100}$/.test(link[key]),
      ) ||
      !Object.hasOwn(propertyRecordConfigs(), link.kind)
    )
      throw Error(t("ui.documentInvalidLinks"));
    const target = {
      propertyId: link.propertyId,
      kind: link.kind,
      recordId: link.recordId,
    };
    links.set(propertyDocumentKey(target), target);
  }
  return [...links.values()];
}
export function propertyDocumentLinksFromForm(form) {
  return normalizePropertyDocumentLinks(
    form.getAll("propertyRecordLinks").map((value) => {
      const [propertyId, kind, recordId, extra] = String(value).split(":");
      if (extra !== undefined) throw Error(t("ui.documentInvalidLinks"));
      return { propertyId, kind, recordId };
    }),
  );
}
export function prunePropertyDocumentLinks(project) {
  const valid = new Set(
    project.property.flatMap((asset) =>
      Object.keys(propertyRecordConfigs()).flatMap((kind) =>
        (asset[kind] || []).map((record) =>
          propertyDocumentKey({
            propertyId: asset.id,
            kind,
            recordId: record.id,
          }),
        ),
      ),
    ),
  );
  for (const document of project.documents)
    if (document.propertyRecordLinks)
      document.propertyRecordLinks = document.propertyRecordLinks.filter(
        (link) => valid.has(propertyDocumentKey(link)),
      );
}
export function propertyRecordDocuments(project, assetId, kind, record) {
  return project.documents.filter(
    (d) =>
      d.id === record.sourceId ||
      (d.propertyRecordLinks || []).some(
        (link) =>
          link.propertyId === assetId &&
          link.kind === kind &&
          link.recordId === record.id,
      ),
  );
}
