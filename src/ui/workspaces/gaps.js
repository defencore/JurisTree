import { types } from "../../core/config.js";
import { $, esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { years } from "../../model/dates.js";
import {
  edgeState,
  gaps,
  linkedDocs,
  requirements,
  route,
} from "../../model/evidence.js";
import { relation } from "../../model/lookup.js";
import { avatar, requirementCard } from "../components.js";
import { icon } from "../icons.js";

export function renderGaps() {
  const gs = gaps(),
    path = route(),
    scope =
      appState.project.purpose === "inheritance" && path.found
        ? appState.project.people.filter((p) => path.people.includes(p.id))
        : appState.project.people;
  const available = scope.flatMap(requirements).filter((t) => t.done).length,
    review = scope
      .flatMap(requirements)
      .filter((t) => t.state === "review").length;
  $("#otherView").innerHTML =
    `<div class="intro-line"><div><h2>${translate("ui.whatYouHaveAndWhatIsStillMissing")}</h2><p>${appState.project.purpose === "inheritance" && path.found ? translate("ui.documentsForTheRouteFromOwnerToClaimant") : translate("ui.documentsForPeopleAndFamilyRelationshipsInThe")}</p></div></div><div class="banner">${icon("clipboard")}${translate("ui.editTheChecklistInThePersonProfileLabels")}</div><div class="gaps-summary"><div class="stat"><strong style="color:var(--teal)">${available}</strong><small>${translate("ui.requiredDocumentsAvailable")}</small></div><div class="stat"><strong style="color:var(--amber)">${gs.length}</strong><small>${translate("ui.evidenceGaps")}</small></div><div class="stat"><strong style="color:var(--violet)">${review}</strong><small>${translate("ui.needReview")}</small></div></div>${scope
      .map((p) => {
        const req = requirements(p);
        if (!req.length) return "";
        return `<section class="gap-group"><div class="gap-head"><button class="kin-person gap-person-title" data-person="${p.id}">${avatar(p)}<span><h3>${esc(p.name)}</h3><small>${esc(years(p))}</small></span></button><span class="pill ${req.every((t) => t.done) ? "teal" : "amber"}">${req.filter((t) => t.done).length} / ${req.length} ${translate("ui.available2")}</span></div>${req.map((t) => requirementCard(p, t)).join("")}</section>`;
      })
      .join(
        "",
      )}<div class="panel-title" style="margin-top:25px"><h3>${translate("ui.relationshipDocuments")}</h3></div>${
      gs
        .filter((g) => g.kind === "relation")
        .map((g) => {
          const r = relation(g.id),
            state = edgeState(r),
            ds = linkedDocs("relation", r.id);
          return `<section class="gap-group"><h3>${esc(g.name)}</h3><div class="requirement ${["review", "requested"].includes(state) ? state : "missing"}" style="margin-top:12px">${icon(state === "review" ? "search" : state === "requested" ? "fileClock" : "fileMissing")}<span><b>${esc(types()[g.type])}</b><small>${state === "review" ? translate("ui.sourceAddedReviewTheRelationship") : state === "requested" ? translate("ui.requestedAwaitingDocument") : state === "indirect" ? translate("ui.onlyIndirectEvidenceAvailable") : translate("ui.officialSourceMissing")}</small></span>${ds.length ? `<button data-document="${ds[0].id}">${translate("ui.open")}</button>` : `<button data-gap-kind="relation" data-gap-id="${r.id}" data-gap-type="${g.type}">${translate("ui.add")}</button>`}</div></section>`;
        })
        .join("") ||
      `<p class="hint">${translate("ui.noGapsInRelationshipDocuments")}</p>`
    }`;
}
