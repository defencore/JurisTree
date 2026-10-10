import { state as appState } from "../../../core/state.js";
import { exportArchive } from "../../../features/archive.js";
import { exportImage } from "../../../features/image-export.js";
import {
  openFiles,
  downloadAttachment,
  cropSourceCopy,
} from "../../../features/attachments.js";
import { editDocument } from "../../../features/documents.js";
import { viewDocument } from "../../../features/document-view.js";
import { showPersonOnMap } from "../../../features/person-navigation.js";
import { editRecordAttachments } from "../../../features/record-attachments.js";
import { fit } from "../../../graph/camera.js";
import { isOfficial, linkedDocs } from "../../../model/evidence.js";
import { copyCitation } from "../../../ui/components.js";
import { selectedSourceContext } from "../clipboard.js";
import { closeModal } from "../../../ui/dialog.js";
import { select } from "../../../ui/render.js";

export const sourcesClicks = [
  {
    priority: 46,
    matches: (b) => b.dataset.attachDocument,
    run: async (b) => {
      closeModal();
      openFiles({
        documentId: b.dataset.attachDocument,
      });
    },
  },
  {
    priority: 47,
    matches: (b) => b.dataset.copyCitation,
    run: async (b) => {
      await copyCitation(b.dataset.copyCitation);
    },
  },
  {
    priority: 48,
    matches: (b) => b.dataset.sourcePerson,
    run: async (b) => {
      closeModal();
      appState.groupFilter = "";
      showPersonOnMap(b.dataset.sourcePerson);
    },
  },
  {
    priority: 49,
    matches: (b) => b.dataset.sourceRelation,
    run: async (b) => {
      closeModal();
      appState.groupFilter = "";
      select("relation", b.dataset.sourceRelation);
      fit();
    },
  },
  {
    priority: 54,
    matches: (b) => b.dataset.document,
    run: async (b) => {
      await viewDocument(b.dataset.document);
    },
  },
  {
    priority: 58,
    matches: (b) => b.dataset.editDocument,
    run: async (b) => {
      closeModal();
      await editDocument(b.dataset.editDocument);
    },
  },
  {
    priority: 60,
    matches: (b) => b.dataset.recordAttachments,
    run: async (b) => {
      await editRecordAttachments({
        personId: b.dataset.attachmentPerson,
        section: b.dataset.attachmentSection,
        recordId: b.dataset.recordAttachments,
      });
    },
  },
  {
    priority: 61,
    matches: (b) => b.hasAttribute("data-paste-source"),
    run: async (b) => {
      await editDocument(b.dataset.pasteSource || null, [], {
        ...selectedSourceContext(),
        type: "photo",
        paste: true,
      });
    },
  },
  {
    priority: 62,
    matches: (b) => b.dataset.addSourceFiles,
    run: async (b) => {
      await editDocument(b.dataset.addSourceFiles);
    },
  },
  {
    priority: 64,
    matches: (b) => b.dataset.addFor,
    run: async (b) => {
      openFiles({
        personId: b.dataset.addFor,
      });
    },
  },
  {
    priority: 65,
    matches: (b) => b.dataset.addRelationDoc,
    run: async (b) => {
      openFiles({
        relationId: b.dataset.addRelationDoc,
      });
    },
  },
  {
    priority: 67,
    matches: (b) => b.dataset.required,
    run: async (b) => {
      const found = linkedDocs("person", b.dataset.requiredPerson).find(
        (d) => d.type === b.dataset.required && isOfficial(d),
      );
      if (found) await viewDocument(found.id);
      else
        openFiles({
          personId: b.dataset.requiredPerson,
          type: b.dataset.required,
        });
    },
  },
  {
    priority: 68,
    matches: (b) => b.dataset.gapKind,
    run: async (b) => {
      openFiles({
        [b.dataset.gapKind === "person" ? "personId" : "relationId"]:
          b.dataset.gapId,
        type: b.dataset.gapType,
      });
    },
  },
  {
    priority: 72,
    matches: (b) => b.dataset.export,
    run: async (b) => {
      if (b.dataset.export === "zip") await exportArchive();
      else await exportImage(b.dataset.export === "svg");
    },
  },
  {
    priority: 73,
    matches: (b) => b.dataset.downloadDoc,
    run: async (b) => {
      downloadAttachment(b.dataset.downloadDoc, b.dataset.attachmentId);
    },
  },
  {
    priority: 74,
    matches: (b) => b.dataset.cropSource,
    run: async (b) => {
      await cropSourceCopy(b.dataset.cropSource, b.dataset.attachmentId);
    },
  },
  {
    priority: 75,
    matches: (b) => b.id === "dropZone",
    run: async (_b) => {
      openFiles();
    },
  },
];
