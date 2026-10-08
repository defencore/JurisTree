import {
  evidenceTypes,
  recordConfigs,
  sectionInfo,
  statusTypes,
  types,
} from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { bytes } from "../core/utils.js";
import { roleLabel } from "../graph/render.js";
import { getLocale, translate } from "../i18n/index.js";
import { displayDate, years } from "../model/dates.js";
import { hasFile } from "../model/evidence.js";
import { person } from "../model/project.js";
import { avatar, sourceChips, sourceLink } from "./components.js";
import { icon } from "./icons.js";
import { fields, recordValues } from "./profile-fields.js";

function section(label, symbol, body, key) {
  if (!body) return "";
  return `<section class="biography-section" data-biography-section="${key}"><h3>${icon(symbol)}${esc(label)}</h3>${body}</section>`;
}

function record(sectionKey, item) {
  const cfg = recordConfigs()[sectionKey];
  const values = recordValues(cfg, item);
  return `<article class="biography-record">${fields(values)}${sourceChips(item.sourceId ? [item.sourceId] : [])}</article>`;
}

function source(d) {
  const url = sourceLink(d);
  return `<article class="biography-record"><h4>${esc(d.title)}</h4>${fields([
    [translate("ui.documentType"), types()[d.type]],
    [translate("ui.documentAvailability"), statusTypes()[d.status]],
    [translate("ui.evidenceType"), evidenceTypes()[d.evidence]],
    [translate("ui.documentDate"), displayDate(d.date)],
    [translate("ui.receivedFromSource"), d.source],
    [translate("ui.archiveOrCollection"), d.repository],
    [translate("ui.recordReference"), d.reference],
    [translate("ui.accessedRequested"), displayDate(d.accessedAt)],
    [translate("ui.language"), d.language],
    [
      translate("ui.file"),
      d.filename ? `${d.filename}${d.size ? ` · ${bytes(d.size)}` : ""}` : "",
    ],
    [translate("ui.documentText"), d.transcription],
    [translate("ui.notes"), d.notes],
  ])}${url ? `<a class="biography-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : ""}<div class="biography-record-actions"><button type="button" class="btn small" data-document="${d.id}">${icon("eye")}${translate("ui.openSource")}</button>${hasFile(d) ? `<button type="button" class="btn small" data-download-doc="${d.id}">${icon("download")}${translate("ui.downloadFile")}</button>` : `<span class="hint">${translate("ui.noDigitalCopyAttachedYet")}</span>`}</div></article>`;
}

export function renderBiography({
  profile: p,
  relations,
  property,
  documents,
  groups,
}) {
  let html = `<article class="biography"><header class="biography-header">${avatar(p)}<div><h2>${esc(p.name)}</h2><p>${esc(years(p))}</p><p class="hint">${translate("ui.autobiographyDescription")}</p></div></header>`;
  html += section(
    translate("ui.basicInformation"),
    "user",
    fields([
      [translate("ui.fullName"), p.name],
      [translate("ui.otherNamesAndSpellings"), p.aliases],
      [
        translate("ui.gender"),
        {
          f: translate("ui.female"),
          m: translate("ui.male"),
          u: translate("ui.notSpecified"),
        }[p.gender || "u"],
      ],
      [
        translate("ui.status"),
        p.death || p.lifeStatus === "deceased"
          ? translate("ui.deceased")
          : p.lifeStatus === "living"
            ? translate("ui.living")
            : translate("ui.unknown"),
      ],
      [translate("ui.birth"), displayDate(p.birth)],
      [translate("ui.deathIfKnown"), displayDate(p.death)],
      [translate("ui.placeOfOriginCountry"), p.place],
      [
        translate("ui.ownerDeceasedEstateOwner"),
        p.id === appState.project.subjectId ? translate("ui.yes") : "",
      ],
      [
        translate("ui.claimant"),
        p.id === appState.project.claimantId ? translate("ui.yes") : "",
      ],
      [
        translate("ui.requiredDocuments"),
        Array.isArray(p.requirements)
          ? p.requirements.map((type) => types()[type]).join("; ")
          : "",
      ],
    ]),
    "basic",
  );
  html += section(
    translate("ui.biographyAndHistory"),
    "book",
    `<div class="biography-prose">${esc(p.biography || translate("ui.noInformationYet"))}</div>${sourceChips(p.bioSourceIds)}`,
    "biography",
  );
  for (const [key, [label, symbol]] of Object.entries(sectionInfo())) {
    const cfg = recordConfigs()[key];
    if (cfg)
      html += section(
        label,
        symbol,
        (p[cfg.key] || []).map((item) => record(key, item)).join(""),
        key,
      );
    else if (key === "interests")
      html += section(
        label,
        symbol,
        fields([
          [translate("ui.hobbies"), p.hobbies],
          [translate("ui.interests"), p.interests],
        ]),
        key,
      );
    else if (key === "health")
      html += section(
        label,
        symbol,
        fields([[translate("ui.healthDetails"), p.health]]) +
          sourceChips(p.healthSourceIds),
        key,
      );
  }
  html += section(
    translate("ui.familyGroups"),
    "users",
    groups
      .map(
        (g) =>
          `<article class="biography-record"><h4>${esc(g.name)}</h4>${g.notes ? `<p class="biography-prose">${esc(g.notes)}</p>` : ""}</article>`,
      )
      .join(""),
    "groups",
  );
  html += section(
    translate("ui.familyRelationships"),
    "link",
    relations
      .map((r) => {
        const other = person(r.from === p.id ? r.to : r.from);
        const sources = documents.filter((d) =>
          (d.relations || []).includes(r.id),
        );
        return `<article class="biography-record"><h4>${esc(roleLabel(r, p.id))} · ${esc(other?.name)}</h4><p class="hint">${esc(other ? years(other) : "")}</p>${r.disputed ? `<span class="pill red">${translate("ui.disputedRelationship")}</span>` : ""}${r.notes ? `<p class="biography-prose">${esc(r.notes)}</p>` : ""}${sourceChips(sources.map((d) => d.id))}${other ? `<button type="button" class="btn small" data-biography="${other.id}">${icon("book")}${translate("ui.autobiography")}</button>` : ""}</article>`;
      })
      .join(""),
    "relationships",
  );
  html += section(
    translate("ui.propertyAndShares"),
    "home",
    property
      .map(
        (a) =>
          `<article class="biography-record"><h4>${esc(a.title)}</h4>${fields([
            [translate("ui.owner"), person(a.ownerId)?.name],
            [
              translate("ui.estimatedValue"),
              a.value !== "" && a.value != null
                ? `${new Intl.NumberFormat(getLocale()).format(a.value)} ${a.currency}`
                : "",
            ],
            [
              translate("ui.allocationPlan"),
              a.allocations
                .map(
                  (share) =>
                    `${person(share.personId)?.name || ""}: ${new Intl.NumberFormat(getLocale()).format(share.percent)}%`,
                )
                .join("\n"),
            ],
            [translate("ui.notes"), a.notes],
          ])}${sourceChips(documents.filter((d) => (d.propertyIds || []).includes(a.id)).map((d) => d.id))}</article>`,
      )
      .join(""),
    "property",
  );
  html += section(
    translate("ui.treeResearchNotes"),
    "notebook",
    p.notes ? `<div class="biography-prose">${esc(p.notes)}</div>` : "",
    "notes",
  );
  html += section(
    translate("ui.documentsAndSources"),
    "files",
    documents.map(source).join(""),
    "documents",
  );
  return html + "</article>";
}
