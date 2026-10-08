import { translate } from "../../i18n/index.js";
import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function sanctionsSection() {
  return defineSection(
    "sanctionRecords",
    "ui.sanctionsAndAssociations",
    "shield",
    "ui.sanctionRecord",
    [
      [
        null,
        [
          ["title", "ui.label", "text"],
          [
            "kind",
            "ui.sanctionRecordKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              designation: "ui.directDesignation",
              association: "ui.sanctionsAssociation",
              other: "ui.other",
            },
          ],
          ["regime", "ui.sanctionsRegime", "text"],
          ["authority", "ui.sanctionsAuthority", "text"],
          ["country", "ui.sanctioningJurisdiction", "text"],
          [
            "status",
            "ui.recordedSanctionsStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              listed: "ui.sanctionsListed",
              delisted: "ui.sanctionsDelisted",
              suspended: "ui.sanctionsSuspended",
              proposed: "ui.sanctionsProposed",
              other: "ui.other",
            },
          ],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.sanctionDetails",
        [
          [
            "measure",
            "ui.sanctionsMeasure",
            "select",
            {
              unspecified: "ui.notSpecified",
              assetFreeze: "ui.assetFreeze",
              travelBan: "ui.travelBan",
              financial: "ui.financialRestriction",
              sectoral: "ui.sectoralRestriction",
              other: "ui.other",
            },
          ],
          ["listingId", "ui.sanctionsListIdentifier", "text"],
          ["legalInstrument", "ui.sanctionsInstrument", "text"],
          ["listedAt", "ui.sanctionsListedOn", "date"],
          ["removedAt", "ui.sanctionsRemovedOn", "date"],
          ["checkedAt", "ui.checkedOn", "date"],
          ["officialUrl", "ui.sanctionsOfficialUrl", "url"],
          ["scope", "ui.sanctionsScope", "textarea"],
        ],
      ],
      [
        "ui.sanctionsConnectionDetails",
        [
          ["relatedPersonId", "ui.associatedPersonInMap", "person"],
          ["entity", "ui.associatedEntity", "text"],
          ["entityIdentifier", "ui.associatedEntityIdentifier", "text"],
          ["connection", "ui.associationDescription", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["listedAt", "removedAt"],
    ],
    {
      hint: translate("ui.sanctionsEntryHint"),
      calendar: {
        type: "sanction",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["listedAt", "ui.sanctionsListedOn"],
          ["removedAt", "ui.sanctionsRemovedOn"],
        ],
      },
    },
  );
}
