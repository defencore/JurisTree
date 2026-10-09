import { personDisplayName } from "../model/person-display.js";
import { evidenceTypes, types } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { sourceVerificationConfig } from "../core/sources.js";
import { bytes } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { documentSubjects, hasFile } from "../model/evidence.js";
import { doc, person, relation } from "../model/lookup.js";
import { sourceRecordLinks } from "../model/source-record-links.js";
import { attachmentSize } from "../model/source-attachments.js";
import { sourceLink, statusBadge } from "../ui/components.js";
import { openDialog } from "../ui/dialog.js";
import { icon, icons } from "../ui/icons.js";
import { recordValues } from "../ui/profile-fields.js";
import { sourceGallery } from "../ui/source-gallery.js";

export async function viewDocument(id) {
  const d = doc(id);
  if (!d) return;
  const external = sourceLink(d);
  const details = [
    [translate("ui.documentType"), types()[d.type]],
    [translate("ui.receivedFromSource"), d.source],
    [translate("ui.archiveOrCollection"), d.repository],
    [translate("ui.recordReference"), d.reference],
    [translate("ui.sourceCollectionTitle"), d.collectionTitle],
    [translate("ui.sourceVolume"), d.volume],
    [translate("ui.sourcePages"), d.pages],
    [translate("ui.documentDate"), d.date],
    [translate("ui.accessedRequested"), d.accessedAt],
    [translate("ui.language"), d.language],
    ...recordValues(sourceVerificationConfig(), d),
  ];
  const records = sourceRecordLinks(appState.project, id);
  await openDialog(
    d.title,
    `<div class="source-view"><div data-source-gallery>${sourceGallery(d)}</div><div class="source-detail"><div class="pills">${statusBadge(d)}<span class="pill ${d.evidence === "official" ? "teal" : d.evidence === "unverified" ? "review" : ""}">${icon(d.evidence === "official" ? "badge" : "help")}${esc(evidenceTypes()[d.evidence])}</span><span class="pill">${icon("paperclip")}${hasFile(d) ? translate("ui.attachedFilesCount", { count: d.attachments.length }) + " · " + bytes(attachmentSize(d)) : translate("ui.noDigitalCopy2")}</span></div><h3>${icon("landmark")}${translate("ui.sourceProvenance")}</h3><dl>${details
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
      .join(
        "",
      )}</dl><div class="source-actions">${external ? `<a class="btn small" href="${esc(external)}" target="_blank" rel="noopener noreferrer">${icon("external")}${translate("ui.openSource")}</a>` : ""}<button type="button" class="btn small" data-copy-citation="${id}">${icon("copy")}${translate("ui.copyCitation")}</button></div><h3>${icon("user")}${translate("ui.documentAbout")}</h3><div class="source-binds">${
      documentSubjects(d)
        .map(person)
        .filter(Boolean)
        .map(
          (p) =>
            `<button type="button" data-source-person="${p.id}">${esc(personDisplayName(p))}</button>`,
        )
        .join("") ||
      `<span class="hint">${translate("ui.theDocumentSubjectHasNotBeenSpecified")}</span>`
    }</div>${records.length ? `<h3>${icon("paperclip")}${translate("ui.linkedProfileRecords")}</h3><div class="source-binds">${records.map(({ profile, record, config, section }) => `<button type="button" data-open-profile-section="${section}" data-profile-person="${profile.id}">${esc(personDisplayName(profile))} · ${esc(config.label)}${record.title || record.awardName ? ` · ${esc(record.title || record.awardName)}` : ""}</button>`).join("")}</div>` : ""}<h3>${icon("users")}${translate("ui.allRelatedPeople")}</h3><div class="source-binds">${
      d.people
        .map((pid) => person(pid))
        .filter(Boolean)
        .map(
          (p) =>
            `<button type="button" data-source-person="${p.id}">${esc(personDisplayName(p))}</button>`,
        )
        .join("") ||
      `<span class="hint">${translate("ui.noPeopleSelected")}</span>`
    }</div>${
      d.relations.length
        ? `<h3>${icon("link")}${translate("ui.supportsRelationships")}</h3><div class="source-binds">${d.relations
            .map((rid) => relation(rid))
            .filter(Boolean)
            .map(
              (r) =>
                `<button type="button" data-source-relation="${r.id}">${esc(personDisplayName(person(r.from)))} · ${esc(personDisplayName(person(r.to)))}</button>`,
            )
            .join("")}</div>`
        : ""
    }</div></div>${d.transcription ? `<p class="field-caption">${icon("scan")}${translate("ui.documentText")}</p><div class="transcription">${esc(d.transcription)}</div>` : ""}${d.notes ? `<p class="field-caption">${icon("notebook")}${translate("ui.notes")}</p><div class="note-box">${esc(d.notes)}</div>` : ""}<div class="source-footer"><button type="button" class="btn primary" data-edit-document="${id}">${icon("edit")}${translate("ui.edit")}</button><button type="button" class="btn danger" data-delete-document="${id}">${icon("trash")}</button></div>`,
    {
      wide: true,
      footer: false,
      kind: "source-view",
      onOpen: () => {
        const modal = $("#modal");
        modal.dataset.sourceId = id;
        modal
          .querySelector("[data-source-gallery]")
          .addEventListener("click", (event) => {
            const button = event.target.closest("[data-show-attachment]");
            if (button) {
              modal.querySelector("[data-source-gallery]").innerHTML =
                sourceGallery(d, button.dataset.showAttachment);
              icons();
            }
          });
      },
    },
  );
}
