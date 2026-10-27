import { localizedConfig } from "../i18n/localized-config.js";
import { defineSection } from "./profile-sections/define.js";

export const propertyDetailsConfig = localizedConfig(
  () =>
    defineSection("", "ui.assetDossier", "home", "ui.assetDossier", [
      [
        null,
        [
          ["identifier", "ui.assetIdentifier"],
          [
            "assetKind",
            "ui.type",
            "select",
            {
              land: "ui.assetLand",
              realEstate: "ui.assetRealEstate",
              vehicle: "ui.assetVehicle",
              account: "ui.bankAccount",
              companyInterest: "ui.assetCompanyInterest",
              other: "ui.other",
            },
          ],
          ["country", "ui.country"],
          ["location", "ui.registeredAddress"],
          ["cadastralNumber", "ui.assetCadastralNumber"],
          ["registrationNumber", "ui.documentRegistryNumber"],
        ],
      ],
      [
        "ui.assetInitialAcquisition",
        [
          ["initialOwnerId", "ui.assetInitialOwner", "person"],
          ["initialOwnerExternal", "ui.propertyExternalParty"],
          ["acquiredAt", "ui.propertyEffectiveDate", "period"],
          ["acquisitionGrounds", "ui.propertyGrounds", "textarea"],
          ["sourceId", "ui.source", "source"],
        ],
      ],
      [
        "ui.assetLegalHolding",
        [
          [
            "holdingKind",
            "ui.assetLegalHolding",
            "select",
            { personal: "ui.assetPersonal", company: "ui.assetCorporate" },
          ],
          ["companyName", "ui.companyName"],
          ["companyNumber", "ui.companyRegistrationNumber"],
        ],
      ],
      [
        "ui.assetIdentity",
        [
          ["economicAssetKey", "ui.assetEconomicKey"],
          [
            "recordStage",
            "ui.assetRecordStage",
            "select",
            {
              current: "ui.assetCurrent",
              historical: "ui.assetHistorical",
              component: "ui.assetComponent",
            },
          ],
          [
            "countingRole",
            "ui.assetCountingRole",
            "select",
            { primary: "ui.assetPrimary", reference: "ui.assetReference" },
          ],
          ["identityNotes", "ui.assetIdentityNotes", "textarea"],
        ],
      ],
    ]).config,
);

export const estateCategoryLabels = {
  all: "ui.estateall",
  atDeath: "ui.estateatDeath",
  disposed: "ui.estatedisposed",
  corporate: "ui.estatecorporate",
  uncertain: "ui.estateuncertain",
};
