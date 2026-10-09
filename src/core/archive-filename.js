import { safeName } from "./utils.js";

/** Use local time and a sortable, filesystem-safe timestamp for portable backups. */
export function archiveFilename(title, date) {
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  const day = [
    pad(date.getFullYear(), 4),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => pad(value))
    .join("-");
  return `${safeName(title)}_${day}_${time}.zip`;
}
