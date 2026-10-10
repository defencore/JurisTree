import { $ } from "../../../core/dom.js";
import { openFiles } from "../../../features/attachments.js";
import {
  closePropertyHistory,
  deletePropertyRecord,
  editPropertyRecord,
  openPropertyHistory,
} from "../../../features/property-history.js";
import { editProperty } from "../../../features/property.js";
import { allocationRow } from "../../../ui/forms/property.js";
import { handleAction } from "../../actions.js";

export const propertyClicks = [
  {
    priority: 6,
    matches: (b) => b.dataset.profileProperty,
    run: async (b) => {
      await editProperty(null, b.dataset.profileProperty);
    },
  },
  {
    priority: 7,
    matches: (b) => b.dataset.propertyCommand,
    run: async (b) => {
      await handleAction(b.dataset.propertyCommand);
    },
  },
  {
    priority: 8,
    matches: (b) => b.hasAttribute("data-property-back"),
    run: async (_b) => {
      closePropertyHistory();
    },
  },
  {
    priority: 9,
    matches: (b) => b.dataset.propertyHistory,
    run: async (b) => {
      openPropertyHistory(b.dataset.propertyHistory);
    },
  },
  {
    priority: 10,
    matches: (b) => b.dataset.addPropertyRecord,
    run: async (b) => {
      await editPropertyRecord(
        b.dataset.propertyId,
        b.dataset.addPropertyRecord,
      );
    },
  },
  {
    priority: 11,
    matches: (b) => b.dataset.editPropertyRecord,
    run: async (b) => {
      await editPropertyRecord(
        b.dataset.propertyId,
        b.dataset.propertyRecordKind,
        b.dataset.editPropertyRecord,
      );
    },
  },
  {
    priority: 12,
    matches: (b) => b.dataset.deletePropertyRecord,
    run: async (b) => {
      await deletePropertyRecord(
        b.dataset.propertyRecordKind,
        b.dataset.deletePropertyRecord,
      );
    },
  },
  {
    priority: 66,
    matches: (b) => b.dataset.assetDoc,
    run: async (b) => {
      openFiles({
        propertyId: b.dataset.assetDoc,
        type: "ownership",
      });
    },
  },
  {
    priority: 69,
    matches: (b) => b.dataset.editProperty,
    run: async (b) => {
      await editProperty(b.dataset.editProperty);
    },
  },
  {
    priority: 70,
    matches: (b) => b.hasAttribute("data-add-allocation"),
    run: async (_b) => {
      $("#allocationRows").insertAdjacentHTML("beforeend", allocationRow());
    },
  },
  {
    priority: 71,
    matches: (b) => b.hasAttribute("data-remove-allocation"),
    run: async (b) => {
      b.closest(".allocation-editor").remove();
    },
  },
];
