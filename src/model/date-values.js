/** Canonical dates retain precision: YYYY, YYYY-MM, YYYY-MM-DD, ~date or start/end. */
export function dateExact(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1 || m < 1 || m > 12 || d < 1) return "";
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? value
    : "";
}

function datePart(value) {
  if (dateExact(value))
    return {
      min: value,
      max: value,
      year: Number(value.slice(0, 4)),
      precision: "day",
    };
  if (/^\d{4}$/.test(value) && Number(value) > 0)
    return {
      min: value + "-01-01",
      max: value + "-12-31",
      year: Number(value),
      precision: "year",
    };
  if (/^\d{4}-\d{2}$/.test(value) && dateExact(value + "-01")) {
    let days = 31;
    while (!dateExact(value + "-" + days)) days--;
    return {
      min: value + "-01",
      max: value + "-" + days,
      year: Number(value.slice(0, 4)),
      precision: "month",
    };
  }
  return null;
}

export function parseDateValue(value) {
  const text = String(value || ""),
    approximate = text.startsWith("~");
  const parts = (approximate ? text.slice(1) : text).split("/");
  if (parts.length > 2 || (approximate && parts.length !== 1)) return null;
  const start = datePart(parts[0]),
    end = parts.length === 2 ? datePart(parts[1]) : start;
  if (!start || !end || end.max < start.min) return null;
  return {
    min: start.min,
    max: end.max,
    year: start.year,
    exact: !approximate && parts.length === 1 && start.precision === "day",
    precision: parts.length === 2 ? "range" : start.precision,
    approximate,
  };
}

function enteredPart(value) {
  const day = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (day) return `${day[3]}-${day[2]}-${day[1]}`;
  const month = /^(\d{2})\.(\d{4})$/.exec(value);
  return month ? `${month[2]}-${month[1]}` : value;
}

/** Invalid text is preserved so form validation can explain it without data loss. */
export function dateInputValue(value) {
  const text = String(value || "").trim();
  const approximate = /^[~≈]\s*/.test(text);
  const body = approximate ? text.replace(/^[~≈]\s*/, "") : text;
  const parts = body.split(/\s*[/–—]\s*|\s+-\s+|(?<=^\d{4})-(?=\d{4}$)/);
  const canonical = (approximate ? "~" : "") + parts.map(enteredPart).join("/");
  return parseDateValue(canonical) ? canonical : text;
}

function displayedPart(value) {
  return value.split("-").reverse().join(".");
}

export function displayDate(value) {
  const text = String(value || "");
  const parsed = parseDateValue(text);
  if (!parsed) return text;
  return (
    (parsed.approximate ? "≈ " : "") +
    (parsed.approximate ? text.slice(1) : text)
      .split("/")
      .map(displayedPart)
      .join(" – ")
  );
}
