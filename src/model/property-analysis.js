import { moneyTotals } from "./money-totals.js";
import { propertyRecordDocuments } from "./property-document-links.js";
import { partialDate, localDateString } from "./dates.js";
import { propertySnapshot } from "./property-history.js";

/** Join only explicit identity keys and predecessor links; matching numbers are review findings. */
export function economicAssetGroups(project) {
  const assets = project.property,
    parents = new Map(assets.map((a) => [a.id, a.id]));
  const root = (id) => {
    while (parents.get(id) !== id) id = parents.get(id);
    return id;
  };
  const join = (a, b) => {
    if (parents.has(a) && parents.has(b)) parents.set(root(a), root(b));
  };
  const keys = new Map();
  for (const asset of assets) {
    if (asset.predecessorId) join(asset.id, asset.predecessorId);
    const key = asset.economicAssetKey?.trim().toLocaleLowerCase();
    if (key) {
      if (keys.has(key)) join(asset.id, keys.get(key));
      else keys.set(key, asset.id);
    }
  }
  const groups = new Map(),
    identifiers = new Map();
  for (const asset of assets) {
    const key = root(asset.id);
    if (!groups.has(key)) groups.set(key, { id: key, assets: [], issues: [] });
    groups.get(key).assets.push(asset);
    for (const field of ["cadastralNumber", "registrationNumber"])
      if (asset[field]?.trim()) {
        const number = `${field}:${asset.country?.trim().toUpperCase() || ""}:${asset[field].trim().toUpperCase().replace(/\s/g, "")}`;
        if (!identifiers.has(number)) identifiers.set(number, new Set());
        identifiers.get(number).add(key);
      }
  }
  for (const matches of identifiers.values())
    if (matches.size > 1)
      for (const key of matches)
        groups.get(key).issues.push("assetPossibleDuplicate");
  for (const group of groups.values()) {
    const primary = group.assets.filter((a) => a.countingRole === "primary");
    group.primary =
      group.assets.length === 1 &&
      !["reference"].includes(group.assets[0].countingRole)
        ? group.assets[0]
        : primary.length === 1 &&
            group.assets.every(
              (a) => a === primary[0] || a.countingRole === "reference",
            )
          ? primary[0]
          : null;
    if (group.assets.length > 1 && !group.primary)
      group.issues.push("assetCountingReview");
    if (group.primary?.recordStage === "historical") {
      group.primary = null;
      group.issues.push("assetHistoricalValue");
    }
    const claims = new Map();
    for (const asset of group.assets)
      for (const claim of asset.claims || []) {
        if (
          ["withdrawn", "rejected"].includes(claim.status) ||
          claim.verification === "refuted"
        )
          continue;
        const key = `${claim.personId || claim.externalPerson?.trim().toLowerCase()}:${claim.kind}`;
        if (!claims.has(key)) claims.set(key, new Set());
        claims.get(key).add(asset.id);
      }
    if ([...claims.values()].some((ids) => ids.size > 1))
      group.issues.push("assetRepeatedClaims");
    group.issues = [...new Set(group.issues)];
  }
  return [...groups.values()];
}

export function propertyInventorySummary(project) {
  const groups = economicAssetGroups(project),
    totals = [],
    corporateTotals = [],
    unclassifiedTotals = [];
  let excluded = 0;
  for (const group of groups) {
    const asset = group.primary;
    if (
      !asset ||
      group.issues.some((code) =>
        ["assetPossibleDuplicate", "assetCountingReview"].includes(code),
      )
    ) {
      excluded++;
      continue;
    }
    if (
      asset.value === "" ||
      asset.value == null ||
      !asset.currency ||
      !Number.isFinite(Number(asset.value))
    )
      continue;
    const target =
      asset.holdingKind === "company"
        ? corporateTotals
        : asset.holdingKind === "personal"
          ? totals
          : unclassifiedTotals;
    target.push([asset.currency, asset.value]);
  }
  return {
    groups,
    totals: moneyTotals(totals),
    corporateTotals: moneyTotals(corporateTotals),
    unclassifiedTotals: moneyTotals(unclassifiedTotals),
    excluded,
  };
}

/** Recorded ownership at death is an inventory category, not a conclusion about succession rights. */
export function estateCategory(asset, project, personId) {
  if (asset.holdingKind === "company") return "corporate";
  const death = partialDate(
    project.people.find((p) => p.id === personId)?.death,
  );
  if (!death?.exact) return "uncertain";
  const owned = propertySnapshot(asset, death.min).ownership.filter(
    (r) => r.record.personId === personId,
  );
  if (
    owned.some(
      (r) => r.period === "uncertain" || r.record.status === "disputed",
    )
  )
    return "uncertain";
  const fullDisposal = (asset.transfers || []).some((r) => {
    const date = partialDate(r.date);
    return (
      r.fromId === personId &&
      r.rightKind === "ownership" &&
      Number(r.sharePercent) >= 100 &&
      r.verification !== "refuted" &&
      date &&
      !date.approximate &&
      date.max < death.min
    );
  });
  if (owned.some((r) => r.period === "active"))
    return fullDisposal ? "uncertain" : "atDeath";
  const disposed = (asset.transfers || []).some((r) => {
    const date = partialDate(r.date);
    return (
      r.fromId === personId &&
      r.rightKind === "ownership" &&
      r.verification !== "refuted" &&
      date &&
      !date.approximate &&
      date.max < death.min
    );
  });
  return disposed ? "disposed" : "uncertain";
}

/** Cash flows are counted as observations, kept separate from asset values and proposed claims. */
export function cashFlowAnalysis(
  project,
  assets = project.property,
  date = localDateString(),
) {
  const rows = assets.flatMap((asset) =>
    (asset.cashFlows || []).map((record) => ({ asset, record })),
  );
  const keys = new Map();
  const transactionKey = (record) =>
    record.transactionKey?.trim()
      ? "id:" + record.transactionKey.trim().toLowerCase()
      : record.date
        ? JSON.stringify([
            record.date,
            record.fromId || record.fromExternal?.trim().toLowerCase(),
            record.toId || record.toExternal?.trim().toLowerCase(),
            Number(record.amount),
            record.currency,
            record.fromAccount || "",
            record.toAccount || "",
          ])
        : "";
  for (const asset of project.property)
    for (const record of asset.cashFlows || []) {
      if (record.verification === "refuted") continue;
      const key = transactionKey(record);
      if (key) keys.set(key, (keys.get(key) || 0) + 1);
    }
  const totals = [];
  return {
    rows: rows.map(({ asset, record }) => {
      const sources = propertyRecordDocuments(
        project,
        asset.id,
        "cashFlows",
        record,
      );
      const duplicate =
        !!transactionKey(record) && keys.get(transactionKey(record)) > 1;
      const when = partialDate(record.date);
      const confirmed = !!(
        !duplicate &&
        record.verification === "corroborated" &&
        when &&
        !when.approximate &&
        when.max <= date &&
        sources.some(
          (d) => d.status === "available" && d.verification === "corroborated",
        )
      );
      if (confirmed) totals.push([record.currency, record.amount]);
      return { asset, record, sources, duplicate, confirmed };
    }),
    totals: moneyTotals(totals),
  };
}
