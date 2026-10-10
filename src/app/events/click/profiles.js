import { prepareBiographyReport } from "../../../features/biography-report.js";
import { $ } from "../../../core/dom.js";
import { state as appState } from "../../../core/state.js";
import { openBiographyReview } from "../../../features/biography-review.js";
import { viewBiography } from "../../../features/biography.js";
import { editDocument } from "../../../features/documents.js";
import { toggleFavorite } from "../../../features/favorites.js";
import { showPersonOnMap } from "../../../features/person-navigation.js";
import { printBiography } from "../../../features/print-biography.js";
import { addProfileRecord } from "../../../features/profile-record-entry.js";
import {
  closeFullProfile,
  openFullProfile,
} from "../../../features/profile-workspace.js";
import { editPerson } from "../../../features/profiles.js";
import { editRelation } from "../../../features/relationships.js";
import { fit } from "../../../graph/camera.js";
import { openPortraitPicker } from "../../../features/portrait.js";
import { renderProfileRecord } from "../../../ui/forms/profile-record.js";
import { icons } from "../../../ui/icons.js";
import { updateProfileCounts } from "../../../ui/profile-navigation.js";
import { render } from "../../../ui/render.js";
import { renderDocuments } from "../../../ui/workspaces/documents.js";

export const profilesClicks = [
  {
    priority: 12,
    matches: (b) => b.dataset.reportBiography,
    run: async (b) => {
      await prepareBiographyReport(b.dataset.reportBiography);
    },
  },
  {
    priority: 1,
    matches: (b) => b.dataset.fullProfile,
    run: async (b) => {
      openFullProfile(b.dataset.fullProfile);
    },
  },
  {
    priority: 2,
    matches: (b) => b.hasAttribute("data-profile-back"),
    run: async (_b) => {
      closeFullProfile();
    },
  },
  {
    priority: 3,
    matches: (b) => b.dataset.profileMap,
    run: async (b) => {
      showPersonOnMap(b.dataset.profileMap);
    },
  },
  {
    priority: 4,
    matches: (b) => b.dataset.profileRelation,
    run: async (b) => {
      await editRelation(null, { from: b.dataset.profileRelation });
    },
  },
  {
    priority: 5,
    matches: (b) => b.dataset.profileReference,
    run: async (b) => {
      await editDocument(null, [], {
        personId: b.dataset.profileReference,
      });
    },
  },
  {
    priority: 13,
    matches: (b) => b.dataset.addProfileDomain,
    run: async (b) => {
      await addProfileRecord(null, b.dataset.addProfileDomain);
    },
  },
  {
    priority: 14,
    matches: (b) => b.dataset.addProfileRecord,
    run: async (b) => {
      await addProfileRecord(b.dataset.addProfileRecord);
    },
  },
  {
    priority: 15,
    matches: (b) => b.dataset.openProfileSection,
    run: async (b) => {
      await editPerson(b.dataset.profilePerson, b.dataset.openProfileSection);
    },
  },
  {
    priority: 16,
    matches: (b) => b.dataset.printBiography,
    run: async (b) => {
      await printBiography(b.dataset.printBiography);
    },
  },
  {
    priority: 21,
    matches: (b) => b.dataset.fastPerson,
    run: async (b) => {
      if (appState.view === "people") {
        openFullProfile(b.dataset.fastPerson);
        return;
      }
      showPersonOnMap(b.dataset.fastPerson);
    },
  },
  {
    priority: 22,
    matches: (b) => b.dataset.favorite,
    run: async (b) => {
      toggleFavorite(b.dataset.favorite);
    },
  },
  {
    priority: 23,
    matches: (b) => b.dataset.reviewPerson,
    run: async (b) => {
      await openBiographyReview(b.dataset.reviewPerson);
    },
  },
  {
    priority: 24,
    matches: (b) => b.dataset.biography,
    run: async (b) => {
      await viewBiography(b.dataset.biography);
    },
  },
  {
    priority: 32,
    matches: (b) => b.hasAttribute("data-source-filter"),
    run: async (b) => {
      appState.docStatusFilter = b.dataset.sourceFilter;
      renderDocuments();
    },
  },
  {
    priority: 33,
    matches: (b) => b.dataset.docLayout,
    run: async (b) => {
      appState.docLayout = b.dataset.docLayout;
      renderDocuments();
    },
  },
  {
    priority: 34,
    matches: (b) => b.dataset.overview,
    run: async (b) => {
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
    },
  },
  {
    priority: 35,
    matches: (b) => b.hasAttribute("data-group-filter"),
    run: async (b) => {
      appState.groupFilter = b.dataset.groupFilter;
      if (!["events", "calendar", "people"].includes(appState.view))
        appState.view = "tree";
      if (appState.view === "people") appState.profileFocus = "";
      appState.eventLimit = 80;
      appState.comparisonPath = null;
      render();
      fit();
    },
  },
  {
    priority: 44,
    matches: (b) => b.dataset.addRecord,
    run: async (b) => {
      const section = b.dataset.addRecord;
      $("#records-" + section).insertAdjacentHTML(
        "beforeend",
        renderProfileRecord(section),
      );
      icons();
      updateProfileCounts();
    },
  },
  {
    priority: 45,
    matches: (b) => b.hasAttribute("data-remove-record"),
    run: async (b) => {
      b.closest(".profile-record").remove();
      updateProfileCounts();
    },
  },
  {
    priority: 56,
    matches: (b) => b.dataset.editPerson,
    run: async (b) => {
      await editPerson(b.dataset.editPerson);
    },
  },
  {
    priority: 57,
    matches: (b) => b.dataset.editRelation,
    run: async (b) => {
      await editRelation(b.dataset.editRelation);
    },
  },
  {
    priority: 63,
    matches: (b) => b.dataset.portrait,
    run: async (b) => {
      await openPortraitPicker(b.dataset.portrait);
    },
  },
];
