import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function assetsSection() {
  return defineSection(
    "assetRecords",
    "ui.identifiedAssets",
    "property",
    "ui.assetRecord",
    [
      [
        null,
        [
          ["title", "ui.assetName", "text"],
          [
            "kind",
            "ui.assetKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              realEstate: "ui.realEstateAsset",
              vehicle: "ui.vehicleAsset",
              movable: "ui.movableAsset",
              securities: "ui.securitiesAsset",
              cash: "ui.cashAsset",
              intellectualProperty: "ui.intellectualPropertyAsset",
              other: "ui.other",
            },
          ],
          ["identifier", "ui.assetIdentifier", "text"],
          ["country", "ui.country", "text"],
          ["location", "ui.place", "text"],
          ["value", "ui.estimatedValue", "number"],
          ["currency", "ui.currency", "text"],
        ],
      ],
      [
        "ui.assetOwnership",
        [
          [
            "ownership",
            "ui.recordedOwnership",
            "select",
            {
              unspecified: "ui.notSpecified",
              legal: "ui.registeredOwnership",
              joint: "ui.jointOwnership",
              beneficial: "ui.beneficialOwnership",
              nominee: "ui.nomineeOwnership",
              claimed: "ui.claimedOwnership",
              other: "ui.other",
            },
          ],
          ["sharePercent", "ui.ownershipPercent", "number"],
          ["registeredOwnerId", "ui.registeredOwnerInMap", "person"],
          ["registeredOwner", "ui.registeredOwnerOutsideMap", "text"],
          ["controllerId", "ui.controllerInMap", "person"],
          ["controller", "ui.controllerOutsideMap", "text"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              held: "ui.assetHeld",
              disposed: "ui.assetDisposed",
              unconfirmed: "ui.pendingVerification",
              other: "ui.other",
            },
          ],
        ],
      ],
      [
        "ui.assetDiscovery",
        [
          ["discoveredAt", "ui.discoveredOn", "date"],
          ["discoveredBy", "ui.discoveredBy", "text"],
          ["valuationDate", "ui.valuationDate", "date"],
          ["registry", "ui.assetRegistry", "text"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      numericMinimums: {
        value: 0,
        sharePercent: 0,
      },
      numericMaximums: {
        sharePercent: 100,
      },
      calendar: {
        type: "asset",
        dates: [
          ["from", "ui.acquisitionDate"],
          ["to", "ui.disposalDate"],
          ["discoveredAt", "ui.discoveredOn"],
          ["valuationDate", "ui.valuationDate"],
        ],
      },
    },
  );
}
