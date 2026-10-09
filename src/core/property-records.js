import { defineSection } from "./profile-sections/define.js";
import { attributionGroup } from "./profile-sections/attribution.js";

const shareBounds = {
  requiredChoices: ["kind"],
  numericMinimums: { sharePercent: 0, amount: 0 },
  numericMaximums: { sharePercent: 100 },
};
const documentGroup = [
  "ui.propertyEvidence",
  [
    ["reference", "ui.recordReference"],
    ["authority", "ui.issuingAuthority"],
    ["registeredAt", "ui.propertyRegistrationDate", "period"],
    ["documentUrl", "ui.sourceUrl", "url"],
  ],
];
export function propertyRecordConfigs() {
  return {
    rights: defineSection(
      "rights",
      "ui.propertyRights",
      "home",
      "ui.propertyRight",
      [
        [
          null,
          [
            ["personId", "ui.propertyHolder", "person"],
            ["externalPerson", "ui.propertyExternalParty"],
            [
              "kind",
              "ui.propertyRightType",
              "select",
              {
                ownership: "ui.registeredOwnership",
                use: "ui.propertyUse",
                lease: "ui.propertyLease",
                beneficial: "ui.beneficialOwnership",
                possession: "ui.propertyPossession",
                management: "ui.propertyManagement",
                other: "ui.other",
              },
            ],
            ["sharePercent", "ui.propertySharePercent", "number"],
            ["from", "ui.from", "period"],
            ["to", "ui.to", "period"],
            [
              "status",
              "ui.status",
              "select",
              {
                unspecified: "ui.notSpecified",
                current: "ui.propertyRightCurrent",
                ended: "ui.propertyRightEnded",
                disputed: "ui.propertyRightDisputed",
              },
            ],
            ["grounds", "ui.propertyGrounds", "textarea"],
          ],
        ],
        documentGroup,
        attributionGroup,
      ],
      [["from", "to"]],
      shareBounds,
    ).config,
    transfers: defineSection(
      "transfers",
      "ui.propertyTransfers",
      "history",
      "ui.propertyTransfer",
      [
        [
          null,
          [
            [
              "kind",
              "ui.propertyTransferType",
              "select",
              {
                gift: "ui.gift",
                sale: "ui.propertySale",
                inheritance: "ui.inheritance",
                registration: "ui.propertyReregistration",
                division: "ui.propertyDivision",
                exchange: "ui.propertyExchange",
                assignment: "ui.propertyAssignment",
                other: "ui.other",
              },
            ],
            ["date", "ui.propertyEffectiveDate", "period"],
            [
              "rightKind",
              "ui.propertyRightType",
              "select",
              {
                ownership: "ui.registeredOwnership",
                use: "ui.propertyUse",
                lease: "ui.propertyLease",
                beneficial: "ui.beneficialOwnership",
                management: "ui.propertyManagement",
                other: "ui.other",
              },
            ],
            ["fromId", "ui.propertyTransferFrom", "person"],
            ["fromExternal", "ui.propertyTransferFromExternal"],
            ["toId", "ui.propertyTransferTo", "person"],
            ["toExternal", "ui.propertyTransferToExternal"],
            ["sharePercent", "ui.propertySharePercent", "number"],
            ["grounds", "ui.propertyGrounds", "textarea"],
          ],
        ],
        [
          "ui.propertyTransferDetails",
          [
            ["signedAt", "ui.propertyContractDate", "period"],
            ["amount", "ui.amount", "number"],
            ["currency", "ui.currency"],
            ["conditions", "ui.propertyTransferConditions", "textarea"],
          ],
        ],
        documentGroup,
        attributionGroup,
      ],
      [],
      shareBounds,
    ).config,
    claims: defineSection(
      "claims",
      "ui.propertyClaims",
      "landmark",
      "ui.propertyClaim",
      [
        [
          null,
          [
            ["personId", "ui.propertyClaimant", "person"],
            ["externalPerson", "ui.propertyExternalParty"],
            [
              "kind",
              "ui.propertyClaimType",
              "select",
              {
                inheritance: "ui.inheritance",
                marital: "ui.propertyMaritalClaim",
                ownership: "ui.registeredOwnership",
                use: "ui.propertyUse",
                creditor: "ui.propertyCreditorClaim",
                other: "ui.other",
              },
            ],
            [
              "status",
              "ui.status",
              "select",
              {
                potential: "ui.propertyClaimPotential",
                asserted: "ui.propertyClaimAsserted",
                disputed: "ui.propertyClaimDisputed",
                recognized: "ui.propertyClaimRecognized",
                withdrawn: "ui.propertyClaimWithdrawn",
                rejected: "ui.propertyClaimRejected",
              },
            ],
            ["date", "ui.propertyClaimDate", "period"],
            ["resolvedAt", "ui.propertyClaimResolvedDate", "period"],
            ["sharePercent", "ui.propertyClaimedShare", "number"],
            ["throughPersonId", "ui.propertyClaimThrough", "person"],
            ["againstPersonId", "ui.propertyClaimAgainst", "person"],
            ["grounds", "ui.propertyClaimGrounds", "textarea"],
            ["evidenceNeeded", "ui.propertyEvidenceNeeded", "textarea"],
          ],
        ],
        [
          "ui.caseDetails",
          [
            ["caseNumber", "ui.caseNumber"],
            ["reference", "ui.recordReference"],
            ["authority", "ui.courtAuthority"],
            ["documentUrl", "ui.sourceUrl", "url"],
          ],
        ],
        attributionGroup,
      ],
      [["date", "resolvedAt"]],
      shareBounds,
    ).config,
  };
}

export function propertyMetadataFields() {
  return ["identifier", "country", "location"];
}
