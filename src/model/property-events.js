import { propertyRecordConfigs } from "../core/property-records.js";
import { translate as t } from "../i18n/index.js";
import { propertyRecords } from "./property-records.js";

/** Property dates belong to financial chronology and never repeat as family anniversaries. */
export function collectPropertyEvents(project, selected) {
  const configs = propertyRecordConfigs();
  return project.property.flatMap((asset) =>
    propertyRecords(asset).flatMap(({ kind, record }) => {
      const participants = configs[kind].fields
        .filter(([, , type]) => type === "person")
        .map(([key]) => record[key])
        .filter(Boolean);
      const personId = participants.find((id) => selected.has(id));
      if (!personId) return [];
      const dates =
        kind === "rights"
          ? [
              ["from", "ui.from"],
              ["to", "ui.to"],
            ]
          : kind === "transfers"
            ? [
                ["date", "ui.propertyEffectiveDate"],
                ["signedAt", "ui.propertyContractDate"],
                ["registeredAt", "ui.propertyRegistrationDate"],
              ]
            : [
                ["date", "ui.propertyClaimDate"],
                ["resolvedAt", "ui.propertyClaimResolvedDate"],
              ];
      const typeLabel = configs[kind].fields.find(([key]) => key === "kind")[3][
        record.kind
      ];
      const seen = new Set();
      return dates.flatMap(([field, caption]) => {
        const date = record[field];
        if (!date || seen.has(date)) return [];
        seen.add(date);
        return [
          {
            id: `${asset.id}:${kind}:${record.id}:${field}`,
            type: "asset",
            personId,
            relatedPersonIds: participants.filter((id) => id !== personId),
            title: `${asset.title} · ${typeLabel} · ${t(caption)}`,
            date,
            annual: false,
            propertyId: asset.id,
            propertyRecordId: record.id,
            sourceId: record.sourceId || "",
            verification: record.verification,
            notes: record.grounds || record.notes || "",
          },
        ];
      });
    }),
  );
}
