import { recordConfigs } from "../core/config.js";
import { translate } from "../i18n/index.js";

const identifier = /^[\w-]{1,100}$/;
export const MAX_DOCUMENT_RECORD_LINKS = 500;

export function documentRecordKey(target) {
  return [target.personId, target.section, target.recordId].join(":");
}

export function normalizeDocumentLinks(value = []) {
  if (!Array.isArray(value) || value.length > MAX_DOCUMENT_RECORD_LINKS)
    throw Error(translate("ui.documentInvalidLinks"));
  const result = new Map();
  for (const target of value) {
    if (
      !target ||
      !["personId", "section", "recordId"].every(
        (key) =>
          typeof target[key] === "string" && identifier.test(target[key]),
      ) ||
      !Object.hasOwn(recordConfigs(), target.section)
    )
      throw Error(translate("ui.documentInvalidLinks"));
    const link = {
      personId: target.personId,
      section: target.section,
      recordId: target.recordId,
    };
    result.set(documentRecordKey(link), link);
  }
  return [...result.values()];
}

export function documentLinksFromForm(form) {
  return normalizeDocumentLinks(
    form.getAll("recordLinks").map((value) => {
      const [personId, section, recordId, extra] = String(value).split(":");
      if (extra !== undefined)
        throw Error(translate("ui.documentInvalidLinks"));
      return { personId, section, recordId };
    }),
  );
}

export function documentSupportsRecord(source, target) {
  const key = documentRecordKey(target);
  return (source.recordLinks || []).some(
    (link) => documentRecordKey(link) === key,
  );
}

/** Removing a fact removes its links, while keeping the source and its files. */
export function pruneDocumentLinks(project) {
  if (!project.documents.some((source) => source.recordLinks?.length)) return;
  const configs = recordConfigs();
  const keys = new Set(
    project.people.flatMap((person) =>
      Object.entries(configs).flatMap(([section, cfg]) =>
        (person[cfg.key] || []).map((record) =>
          documentRecordKey({
            personId: person.id,
            section,
            recordId: record.id,
          }),
        ),
      ),
    ),
  );
  for (const source of project.documents)
    if (source.recordLinks)
      source.recordLinks = source.recordLinks.filter((target) =>
        keys.has(documentRecordKey(target)),
      );
}
