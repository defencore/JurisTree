import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function accountsSection() {
  return defineSection(
    "accountRecords",
    "ui.financialAccounts",
    "landmark",
    "ui.accountRecord",
    [
      [
        null,
        [
          ["label", "ui.label", "text"],
          [
            "kind",
            "ui.accountKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              bank: "ui.bankAccount",
              brokerage: "ui.brokerageAccount",
              payment: "ui.paymentAccount",
              custody: "ui.custodyAccount",
              other: "ui.other",
            },
          ],
          ["institution", "ui.financialInstitution", "text"],
          ["country", "ui.country", "text"],
          ["number", "ui.accountNumber", "text"],
          ["iban", "ui.iban", "text"],
          ["currency", "ui.currency", "text"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              active: "ui.activeAccount",
              closed: "ui.closedAccount",
              frozen: "ui.frozenAccount",
              dormant: "ui.dormantAccount",
              other: "ui.other",
            },
          ],
        ],
      ],
      [
        "ui.accountDetails",
        [
          [
            "role",
            "ui.accountRole",
            "select",
            {
              unspecified: "ui.notSpecified",
              owner: "ui.accountOwner",
              joint: "ui.jointAccountOwner",
              authorized: "ui.authorizedSignatory",
              beneficiary: "ui.accountBeneficiary",
              nominee: "ui.nomineeHolder",
              other: "ui.other",
            },
          ],
          ["holderId", "ui.accountHolderInMap", "person"],
          ["holder", "ui.accountHolderOutsideMap", "text"],
          ["swift", "ui.swiftBic", "text"],
          ["branch", "ui.bankBranch", "text"],
          ["openedAt", "ui.accountOpenedOn", "date"],
          ["closedAt", "ui.accountClosedOn", "date"],
          ["balance", "ui.recordedBalance", "number"],
          ["balanceDate", "ui.balanceDate", "date"],
          ["discoveredAt", "ui.discoveredOn", "date"],
          ["restrictions", "ui.recordedRestrictions", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["openedAt", "closedAt"]],
    {
      calendar: {
        type: "account",
        dates: [
          ["openedAt", "ui.accountOpenedOn"],
          ["closedAt", "ui.accountClosedOn"],
          ["balanceDate", "ui.balanceDate"],
          ["discoveredAt", "ui.discoveredOn"],
        ],
      },
    },
  );
}
