import { safeUrl } from "../core/utils.js";

export function contactHref(record) {
  if (
    record.type === "email" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.value)
  )
    return "mailto:" + record.value;
  if (record.type === "phone" && /^[+\d\s().-]{3,50}$/.test(record.value))
    return "tel:" + record.value.replace(/[^+\d]/g, "");
  return ["social", "website", "messenger"].includes(record.type)
    ? safeUrl(record.url || record.value)
    : "";
}
