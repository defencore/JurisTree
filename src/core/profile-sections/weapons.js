import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function weaponsSection() {
  return defineSection(
    "weaponRecords",
    "ui.weaponOwnership",
    "shield",
    "ui.weaponRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.weaponType",
            "select",
            {
              firearm: "ui.firearm",
              airGun: "ui.airGun",
              coldWeapon: "ui.coldWeapon",
              bow: "ui.bow",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["model", "ui.weaponModel"],
          [
            "ownership",
            "ui.ownershipStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              owned: "ui.personOwned",
              shared: "ui.jointlyOwned",
              borrowed: "ui.borrowed",
              former: "ui.formerlyOwned",
              other: "ui.other",
            },
          ],
          ["acquiredDate", "ui.acquiredOn", "date"],
          ["disposedDate", "ui.disposedOn", "date"],
        ],
      ],
      [
        "ui.weaponPermitDetails",
        [
          ["caliber", "ui.caliber"],
          ["serialNumber", "ui.serialNumber"],
          ["permitNumber", "ui.permitNumber"],
          ["authority", "ui.issuingAuthority"],
          ["permitExpiryDate", "ui.permitExpiryDate", "date"],
          ["storage", "ui.storageLocation"],
        ],
      ],
      attributionGroup,
    ],
    [["acquiredDate", "disposedDate"]],
    {
      calendar: {
        type: "weapon",
        dates: [
          ["acquiredDate", "ui.acquiredOn"],
          ["disposedDate", "ui.disposedOn"],
          ["permitExpiryDate", "ui.permitExpiryDate"],
        ],
      },
    },
  );
}
