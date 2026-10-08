import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function companiesSection() {
  return defineSection(
    "companyRecords",
    "ui.companiesAndInterests",
    "briefcase",
    "ui.companyRecord",
    [
      [
        null,
        [
          ["company", "ui.companyName", "text"],
          ["country", "ui.registrationCountry", "text"],
          ["registrationNumber", "ui.companyRegistrationNumber", "text"],
          [
            "role",
            "ui.companyRole",
            "select",
            {
              unspecified: "ui.notSpecified",
              founder: "ui.companyFounder",
              shareholder: "ui.companyShareholder",
              beneficialOwner: "ui.beneficialOwner",
              nominee: "ui.nomineeHolder",
              director: "ui.companyDirector",
              representative: "ui.companyRepresentative",
              other: "ui.other",
            },
          ],
          ["sharePercent", "ui.ownershipPercent", "number"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.companyDetails",
        [
          ["legalForm", "ui.companyLegalForm", "text"],
          ["taxNumber", "ui.companyTaxNumber", "text"],
          ["registry", "ui.companyRegistry", "text"],
          ["address", "ui.registeredAddress", "text"],
          ["registeredAt", "ui.companyRegisteredOn", "date"],
          ["website", "ui.website", "url"],
          [
            "ownership",
            "ui.ownershipStructure",
            "select",
            {
              unspecified: "ui.notSpecified",
              direct: "ui.directOwnership",
              indirect: "ui.indirectOwnership",
              nominee: "ui.nomineeOwnership",
              beneficial: "ui.beneficialOwnership",
              other: "ui.other",
            },
          ],
          ["shareClass", "ui.shareClass", "text"],
          ["shares", "ui.numberOfShares", "number"],
          ["votingPercent", "ui.votingRightsPercent", "number"],
          ["capitalAmount", "ui.capitalContribution", "number"],
          ["currency", "ui.currency", "text"],
          ["relatedPersonId", "ui.otherPartyInTree", "person"],
          ["intermediary", "ui.intermediaryEntity", "text"],
          ["position", "ui.positionSpecialty", "text"],
          ["control", "ui.controlDescription", "textarea"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentInterest",
              former: "ui.formerInterest",
              disputed: "ui.disputedInterest",
              other: "ui.other",
            },
          ],
          ["discoveredAt", "ui.discoveredOn", "date"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      numericMinimums: {
        sharePercent: 0,
        votingPercent: 0,
        shares: 0,
        capitalAmount: 0,
      },
      numericMaximums: {
        sharePercent: 100,
        votingPercent: 100,
      },
      calendar: {
        type: "company",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["registeredAt", "ui.companyRegisteredOn"],
          ["discoveredAt", "ui.discoveredOn"],
        ],
      },
    },
  );
}
