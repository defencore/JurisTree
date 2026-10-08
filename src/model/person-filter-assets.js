import { partialDate } from "./dates.js";

function decimal(value) {
  const text = String(value).trim();
  const match = text.match(/^([+-]?)(\d*)\.?(\d*)(?:e([+-]?\d+))?$/i);
  if (!match || Math.abs(Number(match[4] || 0)) > 1000) return null;
  return {
    digits: BigInt(
      (match[1] === "-" ? "-" : "") + (match[2] + match[3] || "0"),
    ),
    scale: match[3].length - Number(match[4] || 0),
  };
}
function addDecimal(a, b) {
  const scale = Math.max(a.scale, b.scale);
  return {
    digits:
      a.digits * 10n ** BigInt(scale - a.scale) +
      b.digits * 10n ** BigInt(scale - b.scale),
    scale,
  };
}
function numberFromDecimal(value) {
  return Number(value.digits.toString() + "e" + -value.scale);
}
export function currentRecord(record, today) {
  return (
    record.verification !== "refuted" &&
    !(partialDate(record.from)?.min > today) &&
    !(partialDate(record.to)?.max < today)
  );
}
/** Sum dated, current inventory observations by currency and known ownership share. No exchange rates or other financial collections are combined. */
export function personAssetValues(person, today) {
  const observations = new Map();
  let incomplete = 0;
  for (const record of person.assetRecords || []) {
    if (
      !currentRecord(record, today) ||
      record.status === "disposed" ||
      record.valuationDate > today ||
      record.discoveredAt > today
    )
      continue;
    const key = record.identifier?.trim() || record.id;
    const previous = observations.get(key);
    const date =
      record.valuationDate || record.discoveredAt || record.from || "";
    const previousDate =
      previous?.valuationDate || previous?.discoveredAt || previous?.from || "";
    if (!previous || date > previousDate) observations.set(key, record);
  }
  const totals = {};
  for (const r of observations.values()) {
    const currency = (r.currency || "").trim().toUpperCase();
    if (
      !currency ||
      r.value === "" ||
      r.value == null ||
      r.sharePercent === "" ||
      r.sharePercent == null ||
      !Number.isFinite(Number(r.value)) ||
      !Number.isFinite(Number(r.sharePercent))
    ) {
      incomplete++;
      continue;
    }
    const value = Number(r.value) * (Number(r.sharePercent) / 100);
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      Number(r.sharePercent) < 0 ||
      Number(r.sharePercent) > 100
    ) {
      incomplete++;
      continue;
    }
    const amount = decimal(r.value),
      share = decimal(r.sharePercent);
    if (!amount || !share) {
      incomplete++;
      continue;
    }
    const exact = {
      digits: amount.digits * share.digits,
      scale: amount.scale + share.scale + 2,
    };
    totals[currency] = addDecimal(
      totals[currency] || { digits: 0n, scale: 0 },
      exact,
    );
  }
  return {
    totals: Object.fromEntries(
      Object.entries(totals).map(([currency, total]) => [
        currency,
        numberFromDecimal(total),
      ]),
    ),
    count: observations.size,
    incomplete,
  };
}
