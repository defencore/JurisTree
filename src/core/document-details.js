import { localizedConfig } from "../i18n/localized-config.js";
import { defineSection } from "./profile-sections/define.js";

/** Optional document particulars are separate from the facts they support. */
export const documentDetailsConfig = localizedConfig(
  () =>
    defineSection(
      "",
      "ui.documentDetails",
      "file",
      "ui.documentDetails",
      [
        [
          "",
          [
            ["number", "ui.documentNumber"],
            ["series", "ui.documentSeries"],
            ["issuedBy", "ui.issuingAuthority"],
            ["issuingCountry", "ui.issuingCountry"],
            ["validFrom", "ui.validFrom", "period"],
            ["validUntil", "ui.validUntil", "period"],
          ],
        ],
        [
          "ui.documentRegistryDetails",
          [
            ["registryName", "ui.documentRegistryName"],
            ["registrationNumber", "ui.documentRegistryNumber"],
            ["registrationDate", "ui.documentRegisteredAt", "period"],
            ["objectIdentifier", "ui.documentObjectId"],
          ],
        ],
        [
          "ui.documentCopies",
          [
            [
              "copyKind",
              "ui.documentCopyKind",
              "select",
              {
                original: "ui.documentOriginal",
                copy: "ui.documentCopy",
                certified_copy: "ui.documentCertifiedCopy",
                digital_original: "ui.documentDigitalOriginal",
                translation: "ui.documentTranslation",
              },
            ],
            ["certifiedBy", "ui.documentCertifiedBy"],
            ["certifiedAt", "ui.documentCertifiedAt", "period"],
            ["originalLocation", "ui.documentOriginalLocation"],
          ],
        ],
      ],
      [["validFrom", "validUntil"]],
    ).config,
);
