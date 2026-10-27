import { defineSection } from "./profile-sections/define.js";
import { attributionGroup } from "./profile-sections/attribution.js";

export function additionalPropertyLedgers() {
  return {
    encumbrances: defineSection(
      "encumbrances",
      "ui.assetEncumbrances",
      "landmark",
      "ui.assetEncumbrance",
      [
        [
          null,
          [
            [
              "kind",
              "ui.type",
              "select",
              {
                seizure: "ui.assetSeizure",
                mortgage: "ui.assetMortgage",
                prohibition: "ui.assetProhibition",
                pledge: "ui.assetPledge",
                easement: "ui.assetEasement",
                other: "ui.other",
              },
            ],
            ["personId", "ui.assetBeneficiary", "person"],
            ["externalPerson", "ui.propertyExternalParty"],
            ["from", "ui.from", "period"],
            ["to", "ui.to", "period"],
            [
              "status",
              "ui.status",
              "select",
              {
                current: "ui.propertyRightCurrent",
                ended: "ui.propertyRightEnded",
                disputed: "ui.propertyRightDisputed",
              },
            ],
            ["reference", "ui.recordReference"],
            ["authority", "ui.issuingAuthority"],
            ["grounds", "ui.propertyGrounds", "textarea"],
          ],
        ],
        attributionGroup,
      ],
      [["from", "to"]],
      { requiredChoices: ["kind"] },
    ).config,
    cashFlows: defineSection(
      "cashFlows",
      "ui.flowMap",
      "landmark",
      "ui.flowRecord",
      [
        [
          null,
          [
            [
              "kind",
              "ui.type",
              "select",
              {
                rent: "ui.flowRent",
                sale: "ui.propertySale",
                gift: "ui.gift",
                income: "ui.income",
                loan: "ui.flowLoan",
                repayment: "ui.flowRepayment",
                dividend: "ui.flowDividend",
                expense: "ui.flowExpense",
                other: "ui.other",
              },
            ],
            ["date", "ui.date", "period"],
            ["fromId", "ui.flowPayer", "person"],
            ["fromExternal", "ui.propertyTransferFromExternal"],
            ["toId", "ui.flowRecipient", "person"],
            ["toExternal", "ui.propertyTransferToExternal"],
            ["amount", "ui.amount", "number"],
            ["currency", "ui.currency"],
            ["fromAccount", "ui.flowFromAccount"],
            ["toAccount", "ui.flowToAccount"],
            ["reference", "ui.recordReference"],
            ["transactionKey", "ui.flowTransactionKey"],
            ["grounds", "ui.flowPurpose", "textarea"],
          ],
        ],
        attributionGroup,
      ],
      [],
      { numericMinimums: { amount: 0 }, requiredChoices: ["kind"] },
    ).config,
  };
}
