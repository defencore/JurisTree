import { defineSection } from "./define.js";

export function taxationSection() {
  return defineSection(
    "taxRecords",
    "ui.taxInformation",
    "property",
    "ui.taxRecord",
    [
      [
        null,
        [
          ["country", "ui.country"],
          ["year", "ui.taxYear", "year"],
          ["taxId", "ui.taxIdentificationNumber"],
          [
            "residency",
            "ui.taxResidence",
            "select",
            {
              unspecified: "ui.notSpecified",
              resident: "ui.taxResident",
              nonresident: "ui.taxNonresident",
              partial: "ui.partYearResident",
            },
          ],
          ["currency", "ui.currency"],
        ],
      ],
      [
        "ui.declarationDetails",
        [
          ["authority", "ui.taxAuthority"],
          ["form", "ui.declarationForm"],
          ["filingStatus", "ui.filingStatus"],
          ["reference", "ui.recordReference"],
          ["filedAt", "ui.filingDate", "date"],
          ["address", "ui.taxAddress"],
          ["otherResidencies", "ui.otherTaxResidencies"],
        ],
      ],
      [
        "ui.incomeAndTax",
        [
          ["income", "ui.totalIncome", "number"],
          ["taxableIncome", "ui.taxableIncome", "number"],
          ["deductions", "ui.deductions", "number"],
          ["credits", "ui.taxCredits", "number"],
          ["taxDue", "ui.taxDue", "number"],
          ["taxPaid", "ui.taxPaid", "number"],
          ["refund", "ui.taxRefund", "number"],
        ],
      ],
      [
        "ui.assetsAndLiabilities",
        [
          ["assets", "ui.declaredAssets", "textarea"],
          ["liabilities", "ui.declaredLiabilities", "textarea"],
          ["foreignAccounts", "ui.foreignAccounts", "textarea"],
        ],
      ],
      [
        "ui.notesAndSources",
        [
          ["notes", "ui.additionalDetails", "textarea"],
          ["sourceId", "ui.declarationSource", "source"],
        ],
      ],
    ],
  );
}
