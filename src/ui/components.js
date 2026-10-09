import { docStates } from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { initials, safeUrl } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { hasFile, isOfficial } from "../model/evidence.js";
import { doc } from "../model/lookup.js";
import { primaryAttachment } from "../model/source-attachments.js";
import { orderedPeople } from "../model/person-selection.js";
import { objectUrl } from "../services/blobs.js";
import { openDialog, toast } from "./dialog.js";
import { icon } from "./icons.js";

export function avatar(p) {
  return `<span class="avatar ${p.gender === "f" ? "" : "alt"}">${p.avatarId && appState.blobs.has(p.avatarId) ? `<img alt="" src="${objectUrl(p.avatarId)}">` : esc(initials(p.name))}</span>`;
}
export function biographyButton(p, compact = false) {
  const label = esc(translate("ui.viewAutobiographyOf", { name: p.name }));
  return `<button type="button" class="${compact ? "iconbtn small person-biography" : "btn biography-profile"}" data-biography="${p.id}" aria-label="${label}" title="${label}">${icon("book")}${compact ? "" : translate("ui.autobiography")}</button>`;
}
export function documentIcon(d) {
  return (
    {
      birth: "baby",
      marriage: "heart",
      death: "file",
      name_change: "fingerprint",
      will: "scan",
      probate: "landmark",
      ownership: "home",
      archive: "archive",
      census: "users",
      photo: "photo",
      letter: "mail",
      testimony: "users",
      rumor: "help",
      recording: "file",
    }[d.type] || "file"
  );
}
export function personOptions(id, empty = false) {
  return (
    (empty ? `<option value="">${translate("ui.notSelected")}</option>` : "") +
    orderedPeople(appState.project.people)
      .map((p) => personOption(p, id))
      .join("")
  );
}
export function personOption(person, selectedId) {
  return `<option value="${esc(person.id)}" ${selectedId === person.id ? "selected" : ""}>${esc(person.name)}</option>`;
}
export function typeOptions(list, current) {
  return Object.entries(list)
    .map(
      ([v, t]) =>
        `<option value="${v}" ${v === current ? "selected" : ""}>${esc(t)}</option>`,
    )
    .join("");
}
export function requirementCard(p, t) {
  const ds = t.docIds?.map(doc).filter(Boolean) || [],
    labels = {
      available: ds.some(hasFile)
        ? translate("ui.documentAvailableFileAttached")
        : translate("ui.documentAvailableNoCopyAttached"),
      missing: ds.some((d) => d.status === "not_found")
        ? translate("ui.notFound")
        : translate("ui.documentMissing"),
      review: translate("ui.sourceAvailableReviewNeeded"),
      requested: translate("ui.requestedAwaitingDocument"),
    },
    iconsByState = {
      available: "fileCheck",
      missing: "fileMissing",
      review: "search",
      requested: "fileClock",
    };
  return `<div class="requirement ${t.state === "available" ? "" : t.state}">${icon(iconsByState[t.state] || "fileMissing")}<span><b>${esc(t.title)}</b><small>${labels[t.state]}</small></span>${ds.length ? `<button data-document="${(ds.find(isOfficial) || ds[0]).id}">${translate("ui.open")}</button>` : `<button data-required="${t.type}" data-required-person="${p.id}">${translate("ui.add")}</button>`}</div>`;
}
export function miniDoc(d) {
  const s = docStates()[d.status] || docStates().needs_review;
  return `<div class="doc-mini" data-document="${d.id}" role="button" tabindex="0"><span class="docicon">${primaryAttachment(d)?.mime.startsWith("image/") && hasFile(d) ? `<img src="${objectUrl(primaryAttachment(d).assetId)}" alt="" loading="lazy" decoding="async">` : icon(documentIcon(d))}</span><span><b>${esc(d.title)}</b><small>${s.label} · ${hasFile(d) ? translate("ui.fileAttached") : translate("ui.noDigitalCopy")}</small></span></div>`;
}
export function checks(items, name, selectedIds, labels) {
  return `<div class="check-grid">${items.map((x) => `<label><input type="checkbox" name="${name}" value="${x.id}" ${selectedIds.includes(x.id) ? "checked" : ""}>${esc(labels(x))}</label>`).join("") || `<span class="hint">${translate("ui.noRecords")}</span>`}</div>`;
}
export function sourceLink(d) {
  return safeUrl(d.sourceUrl) || safeUrl(d.source);
}
export function statusBadge(d) {
  const s = docStates()[d.status] || docStates().needs_review;
  return `<span class="pill ${s.tone === "available" ? "teal" : s.tone === "missing" ? "amber" : s.tone === "review" ? "review" : "blue"}">${icon(s.icon)}${s.label}</span>`;
}
export function citation(d) {
  return [
    d.title,
    d.source,
    d.repository,
    d.reference,
    d.date ? `${translate("ui.documentDate2")} ` + d.date : "",
    sourceLink(d),
    d.accessedAt ? `${translate("ui.accessed")} ` + d.accessedAt : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
export async function copyCitation(id) {
  const text = citation(doc(id));
  try {
    if (navigator.clipboard?.writeText)
      await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0";
      document.body.append(area);
      area.select();
      const success = document.execCommand("copy");
      area.remove();
      if (!success) throw Error("copy");
    }
    toast(translate("ui.sourceCitationCopied"));
  } catch {
    await openDialog(
      translate("ui.sourceCitation"),
      `<label class="field">${translate("ui.copyText")}<textarea readonly rows="6">${esc(text)}</textarea></label>`,
      {
        footer: false,
      },
    );
  }
}
export function sourceChips(ids) {
  return (ids || [])
    .map(doc)
    .filter(Boolean)
    .map(
      (d) =>
        `<button class="text-source" data-document="${d.id}">${icon("book")}${esc(d.title)}</button>`,
    )
    .join("");
}
