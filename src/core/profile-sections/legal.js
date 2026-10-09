import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function legalSection() {
  return defineSection(
    "legalRecords",
    "ui.legalHistory",
    "landmark",
    "ui.legalRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.legalEventType",
            "select",
            {
              case: "ui.courtCase",
              administrativeOffense: "ui.administrativeOffense",
              criminalOffense: "ui.criminalOffense",
              investigation: "ui.investigation",
              charge: "ui.formalCharge",
              acquittal: "ui.acquittal",
              propertyDivision: "ui.propertyDivision",
              claim: "ui.legalClaim",
              hearing: "ui.courtHearing",
              judgment: "ui.judgment",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["date", "ui.eventDate", "date"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
        ],
      ],
      [
        "ui.caseDetails",
        [
          ["caseNumber", "ui.caseNumber"],
          ["proceedingNumber", "ui.proceedingNumber"],
          ["registeredAt", "ui.proceedingRegistrationDate", "period"],
          [
            "jurisdiction",
            "ui.caseJurisdiction",
            "select",
            {
              unspecified: "ui.notSpecified",
              civil: "ui.civilProceedings",
              criminal: "ui.criminalProceedings",
              administrative: "ui.administrativeProceedings",
              commercial: "ui.commercialProceedings",
              other: "ui.other",
            },
          ],
          ["country", "ui.country"],
          ["legalProvision", "ui.legalProvision"],
          ["fineAmount", "ui.fineAmount", "number"],
          ["fineCurrency", "ui.currency"],
          ["authority", "ui.courtAuthority"],
          ["decisionReference", "ui.decisionReference"],
          ["decisionUrl", "ui.decisionUrl", "url"],
          ["location", "ui.place"],
          [
            "role",
            "ui.personRole",
            "select",
            {
              unspecified: "ui.notSpecified",
              claimant: "ui.claimantParty",
              defendant: "ui.defendantParty",
              witness: "ui.witness",
              victim: "ui.victim",
              detained: "ui.detainedPerson",
              convicted: "ui.convictedPerson",
              suspect: "ui.suspect",
              other: "ui.other",
            },
          ],
          ["counterpartyId", "ui.otherPartyInTree", "person"],
          ["counterparty", "ui.otherPartyOutsideTree"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              pending: "ui.pendingCase",
              ongoing: "ui.ongoingCase",
              completed: "ui.completedCase",
              appealed: "ui.appealedCase",
              other: "ui.other",
            },
          ],
          ["outcome", "ui.decisionOutcome", "textarea"],
          ["terms", "ui.sentenceConditions", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      calendar: {
        type: "legal",
        dates: [
          ["date", ""],
          ["registeredAt", "ui.proceedingRegistrationDate"],
          ["from", "ui.started"],
          ["to", "ui.ended"],
        ],
      },
    },
  );
}
