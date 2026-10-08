import { translate } from "../../i18n/index.js";
import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function encumbrancesSection() {
  return defineSection(
    "encumbranceRecords",
    "ui.assetRestrictions",
    "landmark",
    "ui.assetRestrictionRecord",
    [
      [
        null,
        [
          ["title", "ui.label", "text"],
          [
            "kind",
            "ui.restrictionKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              attachment: "ui.propertyAttachment",
              seizure: "ui.propertySeizure",
              freeze: "ui.assetFreeze",
              lien: "ui.propertyLien",
              pledge: "ui.propertyPledge",
              mortgage: "ui.propertyMortgage",
              other: "ui.other",
            },
          ],
          ["assetName", "ui.affectedAsset", "text"],
          ["assetReference", "ui.assetAccountReference", "text"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              active: "ui.activeRestriction",
              lifted: "ui.liftedRestriction",
              suspended: "ui.suspendedRestriction",
              pending: "ui.pendingVerification",
              other: "ui.other",
            },
          ],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.restrictionOrder",
        [
          ["country", "ui.country", "text"],
          ["authority", "ui.courtAuthority", "text"],
          ["caseNumber", "ui.caseNumber", "text"],
          ["orderNumber", "ui.orderNumber", "text"],
          ["orderDate", "ui.orderDate", "date"],
          ["liftedAt", "ui.restrictionLiftedOn", "date"],
          ["scope", "ui.restrictionScope", "textarea"],
          ["amount", "ui.amount", "number"],
          ["currency", "ui.currency", "text"],
          ["beneficiaryId", "ui.otherPartyInTree", "person"],
          ["beneficiary", "ui.otherPartyOutsideTree", "text"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["orderDate", "liftedAt"],
    ],
    {
      numericMinimums: {
        amount: 0,
      },
      hint: translate("ui.assetRestrictionHint"),
      calendar: {
        type: "encumbrance",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["orderDate", "ui.orderDate"],
          ["liftedAt", "ui.restrictionLiftedOn"],
        ],
      },
    },
  );
}
