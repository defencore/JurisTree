import { printBiography } from "../../features/print-biography.js";
import { openBiographyReview } from "../../features/biography-review.js";
import { openSearchResult } from "../../features/search.js";
import {
  renderCalendar,
  changeCalendarMonth,
} from "../../features/calendar.js";
import { toggleFavorite } from "../../features/favorites.js";
import { render, select } from "../../ui/render.js";
import { icons } from "../../ui/icons.js";
import { closeModal, confirmDelete, toast } from "../../ui/dialog.js";
import { cropImage } from "../../ui/cropper.js";
import { copyCitation } from "../../ui/components.js";
import { commit } from "../../services/history.js";
import { openFiles } from "../../services/files.js";
import { exportArchive, exportImage } from "../../services/archive.js";
import { doc } from "../../model/project.js";
import { linkedDocs, isOfficial } from "../../model/evidence.js";
import { translate } from "../../i18n/index.js";
import { graphAnalysisDialog } from "../../graph/controls.js";
import { fit, focusPerson } from "../../graph/camera.js";
import { isMobileLayout } from "../../core/viewport.js";
import {
  applyGraphPreset,
  hideGraphRelation,
  revealGraphRelation,
  showAnalysisResult,
} from "../../graph/analysis.js";
import { editRelation } from "../../features/relationships.js";
import { allocationRow, editProperty } from "../../features/property.js";
import {
  closePropertyHistory,
  openPropertyHistory,
  editPropertyRecord,
  deletePropertyRecord,
} from "../../features/property-history.js";
import { editPerson } from "../../features/profiles.js";
import { addProfileRecord } from "../../features/profile-record-entry.js";
import { renderProfileRecord } from "../../ui/forms/profile-record.js";
import { viewBiography } from "../../features/biography.js";
import { selectStartTemplate } from "../../features/launcher.js";
import { deleteGroup, editGroup, toggleGroup } from "../../features/groups.js";
import {
  deleteFamilyEvent,
  editFamilyEvent,
  renderEvents,
} from "../../features/events.js";
import {
  editDocument,
  renderDocuments,
  viewDocument,
} from "../../features/documents.js";
import { download, uid } from "../../core/utils.js";
import { state as appState } from "../../core/state.js";
import { $ } from "../../core/dom.js";
import { handleAction } from "../actions.js";
export function bindClickEvents() {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(
      "button,[data-favorite],[data-person],[data-biography],[data-document],[data-relation],[data-edge],[data-gap-kind],[data-required],[data-toggle-group]",
    );
    if (!b) return;
    try {
      if (b.dataset.propertyCommand) {
        handleAction(b.dataset.propertyCommand);
        return;
      }
      if (b.hasAttribute("data-property-back")) {
        closePropertyHistory();
        return;
      }
      if (b.dataset.propertyHistory) {
        openPropertyHistory(b.dataset.propertyHistory);
        return;
      }
      if (b.dataset.addPropertyRecord) {
        await editPropertyRecord(
          b.dataset.propertyId,
          b.dataset.addPropertyRecord,
        );
        return;
      }
      if (b.dataset.editPropertyRecord) {
        await editPropertyRecord(
          b.dataset.propertyId,
          b.dataset.propertyRecordKind,
          b.dataset.editPropertyRecord,
        );
        return;
      }
      if (b.dataset.deletePropertyRecord) {
        await deletePropertyRecord(
          b.dataset.propertyRecordKind,
          b.dataset.deletePropertyRecord,
        );
        return;
      }
      if (b.dataset.addProfileDomain) {
        await addProfileRecord(null, b.dataset.addProfileDomain);
        return;
      }
      if (b.dataset.addProfileRecord) {
        await addProfileRecord(b.dataset.addProfileRecord);
        return;
      }
      if (b.dataset.openProfileSection) {
        await editPerson(b.dataset.profilePerson, b.dataset.openProfileSection);
        return;
      }
      if (b.dataset.printBiography) {
        await printBiography(b.dataset.printBiography);
        return;
      }
      if (b.dataset.searchKind) {
        await openSearchResult(b.dataset.searchKind, b.dataset.searchId);
        return;
      }
      if (b.dataset.calendarOpenMonth) {
        changeCalendarMonth(b.dataset.calendarOpenMonth);
        return;
      }
      if (b.dataset.calendarMode) {
        appState.calendarMode = b.dataset.calendarMode;
        renderCalendar();
        return;
      }
      if (b.dataset.calendarDay) {
        appState.calendarDay = b.dataset.calendarDay;
        renderCalendar();
        return;
      }
      if (b.dataset.fastPerson) {
        select("person", b.dataset.fastPerson);
        focusPerson(b.dataset.fastPerson);
        return;
      }
      if (b.dataset.favorite) {
        toggleFavorite(b.dataset.favorite);
        return;
      }
      if (b.dataset.reviewPerson) {
        await openBiographyReview(b.dataset.reviewPerson);
        return;
      }
      if (b.dataset.biography) {
        await viewBiography(b.dataset.biography);
        return;
      }
      if (b.dataset.startTemplate) {
        selectStartTemplate(b.dataset.startTemplate);
        return;
      }
      if (b.dataset.analysisMode) {
        graphAnalysisDialog(b.dataset.analysisMode);
        return;
      }
      if (b.hasAttribute("data-analysis-path")) {
        showAnalysisResult(
          Number(b.dataset.analysisPath),
          b.dataset.analysisFocus === "true",
        );
        return;
      }
      if (b.hasAttribute("data-analysis-result")) {
        showAnalysisResult(null, b.dataset.analysisFocus === "true");
        return;
      }
      if (b.dataset.graphPreset) {
        closeModal();
        applyGraphPreset(b.dataset.graphPreset);
        return;
      }
      if (b.dataset.hideGraphRelation) {
        hideGraphRelation(b.dataset.hideGraphRelation);
        return;
      }
      if (b.dataset.revealGraphRelation) {
        revealGraphRelation(b.dataset.revealGraphRelation);
        return;
      }
      if (b.hasAttribute("data-source-filter")) {
        appState.docStatusFilter = b.dataset.sourceFilter;
        renderDocuments();
        return;
      }
      if (b.dataset.docLayout) {
        appState.docLayout = b.dataset.docLayout;
        renderDocuments();
        return;
      }
      if (b.dataset.overview) {
        const f = b.dataset.overview;
        appState.docFilter = "";
        appState.docTypeFilter = "";
        if (f === "gaps") {
          appState.view = "gaps";
        } else {
          appState.view = "documents";
          appState.docStatusFilter =
            f === "available" ? "available" : f === "review" ? "review" : "";
          appState.docFileFilter = f === "files" ? "attached" : "";
        }
        render();
        return;
      }
      if (b.hasAttribute("data-group-filter")) {
        appState.groupFilter = b.dataset.groupFilter;
        if (!["events", "calendar"].includes(appState.view))
          appState.view = "tree";
        appState.eventLimit = 80;
        appState.comparisonPath = null;
        render();
        fit();
        return;
      }
      if (b.dataset.eventMode) {
        appState.eventMode = b.dataset.eventMode;
        appState.eventLimit = 80;
        renderEvents();
        return;
      }
      if (b.dataset.editEvent) {
        await editFamilyEvent(b.dataset.eventOwner, b.dataset.editEvent);
        return;
      }
      if (b.dataset.deleteEvent) {
        await deleteFamilyEvent(b.dataset.eventOwner, b.dataset.deleteEvent);
        return;
      }
      if (b.dataset.eventPerson) {
        select("person", b.dataset.eventPerson);
        isMobileLayout() ? focusPerson() : fit();
        return;
      }
      if (b.dataset.editGroup) {
        await editGroup(b.dataset.editGroup);
        return;
      }
      if (b.dataset.toggleGroup) {
        toggleGroup(b.dataset.toggleGroup);
        return;
      }
      if (b.dataset.deleteGroup) {
        await deleteGroup(b.dataset.deleteGroup);
        return;
      }
      if (b.dataset.addKin) {
        const id = b.dataset.kinPerson,
          other = appState.project.people.find((p) => p.id !== id)?.id;
        const type =
          b.dataset.addKin === "partners"
            ? "spouse"
            : b.dataset.addKin === "professional"
              ? "professional"
              : b.dataset.addKin === "other"
                ? "acquaintance"
                : "parent";
        await editRelation(
          null,
          b.dataset.addKin === "parents"
            ? {
                from: other,
                to: id,
                type,
              }
            : {
                from: id,
                to: other,
                type,
              },
        );
        return;
      }
      if (b.dataset.addRecord) {
        const section = b.dataset.addRecord;
        $("#records-" + section).insertAdjacentHTML(
          "beforeend",
          renderProfileRecord(section),
        );
        icons();
        return;
      }
      if (b.hasAttribute("data-remove-record")) {
        b.closest(".profile-record").remove();
        return;
      }
      if (b.dataset.attachDocument) {
        closeModal();
        openFiles({
          documentId: b.dataset.attachDocument,
        });
        return;
      }
      if (b.dataset.copyCitation) {
        await copyCitation(b.dataset.copyCitation);
        return;
      }
      if (b.dataset.sourcePerson) {
        closeModal();
        appState.groupFilter = "";
        select("person", b.dataset.sourcePerson);
        isMobileLayout() ? focusPerson() : fit();
        return;
      }
      if (b.dataset.sourceRelation) {
        closeModal();
        appState.groupFilter = "";
        select("relation", b.dataset.sourceRelation);
        fit();
        return;
      }
      if (b.hasAttribute("data-show-kin-path")) {
        if (!appState.currentKinResult?.found) return;
        appState.comparisonPath = {
          people: appState.currentKinResult.people,
          relations: appState.currentKinResult.relations,
        };
        appState.groupFilter = "";
        appState.selected = {
          kind: "person",
          id: appState.currentKinResult.from,
        };
        appState.view = "tree";
        closeModal();
        commit(() => {
          appState.project.groups.forEach((g) => {
            if (
              appState.project.people.some(
                (p) =>
                  appState.comparisonPath.people.includes(p.id) &&
                  (p.groupIds || []).includes(g.id),
              )
            )
              g.collapsed = false;
          });
        });
        fit();
        return;
      }
      if (b.dataset.action) {
        await handleAction(b.dataset.action);
        return;
      }
      if (b.dataset.view) {
        appState.view = b.dataset.view;
        render();
        if (appState.view === "tree") isMobileLayout() ? focusPerson() : fit();
        if (isMobileLayout()) $("#sidebar").classList.remove("open");
        return;
      }
      if (b.dataset.person) {
        select("person", b.dataset.person);
        focusPerson();
        return;
      }
      if (b.dataset.document) {
        await viewDocument(b.dataset.document);
        return;
      }
      if (b.dataset.relation || b.dataset.edge) {
        select("relation", b.dataset.relation || b.dataset.edge);
        return;
      }
      if (b.dataset.editPerson) {
        await editPerson(b.dataset.editPerson);
        return;
      }
      if (b.dataset.editRelation) {
        await editRelation(b.dataset.editRelation);
        return;
      }
      if (b.dataset.editDocument) {
        closeModal();
        await editDocument(b.dataset.editDocument);
        return;
      }
      for (const k of ["Person", "Relation", "Document", "Property"])
        if (b.dataset["delete" + k]) {
          await confirmDelete(k.toLowerCase(), b.dataset["delete" + k]);
          return;
        }
      if (b.dataset.portrait) {
        appState.portraitPerson = b.dataset.portrait;
        $("#portraitInput").value = "";
        $("#portraitInput").click();
        return;
      }
      if (b.dataset.addFor) {
        openFiles({
          personId: b.dataset.addFor,
        });
        return;
      }
      if (b.dataset.addRelationDoc) {
        openFiles({
          relationId: b.dataset.addRelationDoc,
        });
        return;
      }
      if (b.dataset.assetDoc) {
        openFiles({
          propertyId: b.dataset.assetDoc,
          type: "ownership",
        });
        return;
      }
      if (b.dataset.required) {
        const found = linkedDocs("person", b.dataset.requiredPerson).find(
          (d) => d.type === b.dataset.required && isOfficial(d),
        );
        if (found) await viewDocument(found.id);
        else
          openFiles({
            personId: b.dataset.requiredPerson,
            type: b.dataset.required,
          });
        return;
      }
      if (b.dataset.gapKind) {
        openFiles({
          [b.dataset.gapKind === "person" ? "personId" : "relationId"]:
            b.dataset.gapId,
          type: b.dataset.gapType,
        });
        return;
      }
      if (b.dataset.editProperty) {
        await editProperty(b.dataset.editProperty);
        return;
      }
      if (b.hasAttribute("data-add-allocation")) {
        $("#allocationRows").insertAdjacentHTML("beforeend", allocationRow());
        return;
      }
      if (b.hasAttribute("data-remove-allocation")) {
        b.closest(".allocation-editor").remove();
        return;
      }
      if (b.dataset.export) {
        if (b.dataset.export === "zip") await exportArchive();
        else await exportImage(b.dataset.export === "svg");
        return;
      }
      if (b.dataset.downloadDoc) {
        const d = doc(b.dataset.downloadDoc);
        download(appState.blobs.get(d.assetId), d.filename || d.title);
        return;
      }
      if (b.dataset.recrop) {
        const d = doc(b.dataset.recrop);
        closeModal();
        const blob = await cropImage(appState.blobs.get(d.assetId), false);
        if (blob)
          commit(() => {
            const id = uid();
            appState.blobs.set(id, blob);
            d.assetId = id;
            d.mime = blob.type;
            d.size = blob.size;
            d.filename = d.filename.replace(/\.[^.]*$/, ".webp");
          });
        return;
      }
      if (b.id === "dropZone") openFiles();
    } catch (err) {
      toast(err.message || translate("ui.couldNotCompleteTheAction"), true);
    }
  });
}
