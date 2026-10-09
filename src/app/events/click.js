import { $ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { download, uid } from "../../core/utils.js";
import { isMobileLayout } from "../../core/viewport.js";
import { exportArchive, exportImage } from "../../features/archive.js";
import { openFiles } from "../../features/attachments.js";
import { openBiographyReview } from "../../features/biography-review.js";
import { viewBiography } from "../../features/biography.js";
import { changeCalendarMonth } from "../../features/calendar.js";
import { confirmDelete } from "../../features/delete.js";
import { editDocument, viewDocument } from "../../features/documents.js";
import { deleteFamilyEvent, editFamilyEvent } from "../../features/events.js";
import { toggleFavorite } from "../../features/favorites.js";
import {
  applyGraphPreset,
  hideGraphRelation,
  revealGraphRelation,
  showAnalysisResult,
  toggleGraphSelection,
} from "../../features/graph-analysis.js";
import { graphAnalysisDialog } from "../../features/graph-tools.js";
import { deleteGroup, editGroup, toggleGroup } from "../../features/groups.js";
import { selectStartTemplate } from "../../features/launcher.js";
import { showPersonOnMap } from "../../features/person-navigation.js";
import { printBiography } from "../../features/print-biography.js";
import { addProfileRecord } from "../../features/profile-record-entry.js";
import {
  closeFullProfile,
  openFullProfile,
} from "../../features/profile-workspace.js";
import { editPerson } from "../../features/profiles.js";
import {
  closePropertyHistory,
  deletePropertyRecord,
  editPropertyRecord,
  openPropertyHistory,
} from "../../features/property-history.js";
import { editProperty } from "../../features/property.js";
import { editRelation } from "../../features/relationships.js";
import { openSearchResult } from "../../features/search.js";
import { fit, focusPerson } from "../../graph/camera.js";
import { translate } from "../../i18n/index.js";
import { isOfficial, linkedDocs } from "../../model/evidence.js";
import { doc } from "../../model/lookup.js";
import { commit } from "../../services/history.js";
import { copyCitation } from "../../ui/components.js";
import { cropImage } from "../../ui/cropper.js";
import { closeModal, toast } from "../../ui/dialog.js";
import { renderProfileRecord } from "../../ui/forms/profile-record.js";
import { allocationRow } from "../../ui/forms/property.js";
import { icons } from "../../ui/icons.js";
import { updateProfileCounts } from "../../ui/profile-navigation.js";
import { render, select } from "../../ui/render.js";
import { renderCalendar } from "../../ui/workspaces/calendar.js";
import { renderDocuments } from "../../ui/workspaces/documents.js";
import { renderEvents } from "../../ui/workspaces/events.js";
import { handleAction } from "../actions.js";

export function bindClickEvents() {
  document.addEventListener("pointerdown", (e) => {
    const target = e.target.closest("[data-person]");
    if (
      !target ||
      e.button !== 0 ||
      e.pointerType === "touch" ||
      appState.view !== "tree" ||
      !(e.ctrlKey || e.metaKey || e.shiftKey)
    )
      return;
    e.preventDefault();
    toggleGraphSelection(target.dataset.person);
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(
      "button,[data-favorite],[data-person],[data-biography],[data-document],[data-relation],[data-edge],[data-gap-kind],[data-required],[data-toggle-group]",
    );
    if (!b) return;
    try {
      if (b.dataset.historyCommand) {
        await handleAction(b.dataset.historyCommand);
        return;
      }
      if (b.dataset.fullProfile) {
        openFullProfile(b.dataset.fullProfile);
        return;
      }
      if (b.hasAttribute("data-profile-back")) {
        closeFullProfile();
        return;
      }
      if (b.dataset.profileMap) {
        showPersonOnMap(b.dataset.profileMap);
        return;
      }
      if (b.dataset.profileRelation) {
        await editRelation(null, { from: b.dataset.profileRelation });
        return;
      }
      if (b.dataset.profileReference) {
        await editDocument(null, null, {
          personId: b.dataset.profileReference,
        });
        return;
      }
      if (b.dataset.profileProperty) {
        await editProperty(null, b.dataset.profileProperty);
        return;
      }
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
        if (appState.view === "people") {
          openFullProfile(b.dataset.fastPerson);
          return;
        }
        showPersonOnMap(b.dataset.fastPerson);
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
        if (!["events", "calendar", "people"].includes(appState.view))
          appState.view = "tree";
        if (appState.view === "people") appState.profileFocus = "";
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
        updateProfileCounts();
        return;
      }
      if (b.hasAttribute("data-remove-record")) {
        b.closest(".profile-record").remove();
        updateProfileCounts();
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
        showPersonOnMap(b.dataset.sourcePerson);
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
        if (appState.view === "people") appState.profileFocus = "";
        render();
        if (appState.view === "tree") isMobileLayout() ? focusPerson() : fit();
        if (isMobileLayout()) $("#sidebar").classList.remove("open");
        return;
      }
      if (b.dataset.person) {
        if (
          appState.view === "tree" &&
          (e.ctrlKey || e.metaKey || e.shiftKey)
        ) {
          if (!e.detail) toggleGraphSelection(b.dataset.person);
          return;
        }
        showPersonOnMap(b.dataset.person);
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
