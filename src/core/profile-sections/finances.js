import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function financesSection() {
  return defineSection(
    "financialRecords",
    "ui.financialHistory",
    "property",
    "ui.financialRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.financialType",
            "select",
            {
              income: "ui.income",
              expense: "ui.expense",
              gift: "ui.gift",
              debt: "ui.debt",
              loan: "ui.loan",
              deposit: "ui.deposit",
              investment: "ui.investment",
              guarantee: "ui.guarantee",
              obligation: "ui.financialObligation",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["category", "ui.spendingCategory"],
          ["amount", "ui.amount", "number"],
          ["currency", "ui.currency"],
          ["date", "ui.transactionDate", "date"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.partiesAndTerms",
        [
          [
            "direction",
            "ui.financialDirection",
            "select",
            {
              unspecified: "ui.notSpecified",
              received: "ui.received",
              given: "ui.given",
              borrowed: "ui.borrowed",
              lent: "ui.lent",
              payable: "ui.payable",
              receivable: "ui.receivable",
              held: "ui.held",
              other: "ui.other",
            },
          ],
          ["counterpartyId", "ui.otherPartyInTree", "person"],
          ["counterparty", "ui.otherPartyOutsideTree"],
          ["institution", "ui.financialInstitution"],
          ["reference", "ui.contractAccountReference"],
          ["dueDate", "ui.dueDate", "date"],
          ["interestRate", "ui.interestRate", "number"],
          [
            "frequency",
            "ui.paymentFrequency",
            "select",
            {
              unspecified: "ui.notSpecified",
              once: "ui.oneTimeEvent",
              daily: "ui.daily",
              weekly: "ui.weekly",
              monthly: "ui.monthly",
              quarterly: "ui.quarterly",
              annual: "ui.annually",
              other: "ui.other",
            },
          ],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              planned: "ui.planned",
              active: "ui.active",
              settled: "ui.settled",
              overdue: "ui.overdue",
              other: "ui.other",
            },
          ],
          ["collateral", "ui.collateralEncumbrance", "textarea"],
          ["terms", "ui.financialTerms", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      calendar: {
        type: "finance",
        dates: [
          ["date", ""],
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["dueDate", "ui.dueDate"],
        ],
      },
    },
  );
}
