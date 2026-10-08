import { translate } from "../i18n/index.js";
export const uid = () => crypto.randomUUID();
export const clone = (value) => structuredClone(value);
export function bytes(n) {
  return n >= 1048576
    ? (n / 1048576).toFixed(1) + ` ${translate("ui.mb")}`
    : Math.round(n / 1024) + ` ${translate("ui.kb")}`;
}
export function download(blob, name) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function safeName(s) {
  return s.replace(/[\\/:*?"<>|]/g, "-").slice(0, 100) || "juristree";
}
export async function dataUrl(blob) {
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
export function initials(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}
export function safeUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
