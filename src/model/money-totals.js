/** Add decimal observations exactly before returning display numbers, without converting currencies. */
export function moneyTotals(entries) {
  const values = new Map();
  for (const [currency, value] of entries) {
    if (!/^[A-Z]{3}$/.test(currency || "") || !Number.isFinite(Number(value)))
      continue;
    const match = String(value).match(
      /^([+-]?)(\d*)\.?(\d*)(?:e([+-]?\d+))?$/i,
    );
    if (!match || Math.abs(Number(match[4] || 0)) > 1000) continue;
    const digits = BigInt(
        (match[1] === "-" ? "-" : "") + (match[2] + match[3] || "0"),
      ),
      scale = match[3].length - Number(match[4] || 0);
    const previous = values.get(currency) || { digits: 0n, scale: 0 },
      nextScale = Math.max(scale, previous.scale);
    values.set(currency, {
      digits:
        previous.digits * 10n ** BigInt(nextScale - previous.scale) +
        digits * 10n ** BigInt(nextScale - scale),
      scale: nextScale,
    });
  }
  return Object.fromEntries(
    [...values].map(([currency, value]) => [
      currency,
      Number(value.digits.toString() + "e" + -value.scale),
    ]),
  );
}
