import { localDateString, partialDate, utcDay } from "./dates.js";
import { propertyRecords } from "./property-records.js";

/** Inclusive recorded periods; year-only boundaries and missing dates never imply exact ownership. */
export function propertyPeriod(
  record,
  date = localDateString(),
  today = localDateString(),
) {
  if (record.verification === "refuted") return "excluded";
  const from = partialDate(record.from),
    to = partialDate(record.to);
  if (from?.approximate || to?.approximate) return "uncertain";
  if (from && from.min > date) return "future";
  if (to && to.max < date) return "ended";
  if (!from || from.max > date || (to && to.min < date)) return "uncertain";
  if (!to && (record.status !== "current" || date > today)) return "uncertain";
  return "active";
}
export function propertyClaimOpen(record, date = localDateString()) {
  if (record.verification === "refuted") return false;
  const from = partialDate(record.date),
    to = partialDate(record.resolvedAt);
  if (from && !from.approximate && from.min > date) return false;
  if (to && !to.approximate && to.max <= date) return false;
  return ["potential", "asserted", "disputed"].includes(record.status) || !!to;
}
export function propertySnapshot(asset, date = localDateString()) {
  const rights = (asset.rights || []).map((record) => ({
    record,
    period: propertyPeriod(record, date),
  }));
  const active = rights.filter((r) =>
    ["active", "uncertain"].includes(r.period),
  );
  const ownership = active.filter(({ record }) => record.kind === "ownership");
  const known = ownership.filter(
    ({ record, period }) =>
      period === "active" &&
      record.sharePercent !== "" &&
      record.sharePercent != null,
  );
  return {
    rights: active,
    ownership,
    use: active.filter(({ record }) =>
      [
        "use",
        "lease",
        "possession",
        "management",
        "beneficial",
        "other",
      ].includes(record.kind),
    ),
    shareTotal: known.reduce(
      (sum, { record }) => sum + Number(record.sharePercent),
      0,
    ),
    incomplete: ownership.some(
      ({ record, period }) =>
        period === "uncertain" ||
        record.sharePercent === "" ||
        record.sharePercent == null,
    ),
    claims: (asset.claims || []).filter((r) => propertyClaimOpen(r, date)),
  };
}
export function propertyTimeline(asset) {
  return propertyRecords(asset).sort((a, b) => {
    const first = partialDate(a.record.date || a.record.from),
      second = partialDate(b.record.date || b.record.from);
    return first && second
      ? first.min.localeCompare(second.min) ||
          a.record.id.localeCompare(b.record.id)
      : first
        ? -1
        : second
          ? 1
          : a.record.id.localeCompare(b.record.id);
  });
}

/** Review findings concern the entered evidence, never legal entitlement or transaction validity. */
export function analyzeProperty(asset, project, date = localDateString()) {
  const snapshot = propertySnapshot(asset, date),
    issues = [];
  const add = (code, kind = "", id = "") => issues.push({ code, kind, id });
  if (!snapshot.ownership.length) add("propertyNoDatedOwner");
  if (snapshot.incomplete) add("propertyUncertainOwnership");
  if (snapshot.shareTotal > 100.001) add("propertyOverlappingShares");
  if (snapshot.claims.length) add("propertyOutstandingClaims");
  const documents = new Map(project.documents.map((d) => [d.id, d]));
  const people = new Map(project.people.map((p) => [p.id, p]));
  for (const { kind, record } of propertyTimeline(asset)) {
    const origin = partialDate(record.date || record.from);
    if (origin && !origin.approximate && origin.min > date) continue;
    if (record.verification === "refuted") continue;
    const source = documents.get(record.sourceId);
    if (
      record.verification !== "corroborated" ||
      record.status === "disputed" ||
      (source && source.verification !== "corroborated")
    )
      add("propertyRecordNeedsReview", kind, record.id);
    if (
      !source ||
      source.status !== "available" ||
      source.verification === "refuted"
    )
      add("propertyMissingEvidence", kind, record.id);
    if (kind !== "transfers") continue;
    if (!origin) add("propertyTransferDateMissing", kind, record.id);
    if (
      record.toId &&
      !(asset.rights || []).some(
        (r) =>
          r.personId === record.toId &&
          r.kind === record.rightKind &&
          r.verification !== "refuted" &&
          (!origin ||
            !partialDate(r.from) ||
            partialDate(r.from).min <= origin.max) &&
          (!origin ||
            !partialDate(r.to) ||
            partialDate(r.to).max >= origin.min),
      )
    )
      add("propertyRecipientRightMissing", kind, record.id);
    if (
      record.rightKind === "ownership" &&
      record.fromId &&
      origin?.exact &&
      !["registration", "inheritance"].includes(record.kind)
    ) {
      const previous = utcDay(origin.min) - 1;
      const before = new Date(previous * 86400000).toISOString().slice(0, 10);
      const held = propertySnapshot(asset, before).ownership.filter(
        ({ record: r, period }) =>
          r.personId === record.fromId && period === "active",
      );
      if (!held.length) add("propertyTransferorRightMissing", kind, record.id);
      else if (
        record.sharePercent &&
        held.every(({ record: r }) => r.sharePercent !== "") &&
        held.reduce((sum, { record: r }) => sum + Number(r.sharePercent), 0) +
          0.001 <
          Number(record.sharePercent)
      )
        add("propertyTransferredShareMismatch", kind, record.id);
    }
    const signed = partialDate(record.signedAt),
      death = partialDate(people.get(record.fromId)?.death);
    if (
      signed &&
      death &&
      !signed.approximate &&
      !death.approximate &&
      signed.min > death.max
    )
      add("propertyContractAfterDeath", kind, record.id);
  }
  return { snapshot, issues };
}
