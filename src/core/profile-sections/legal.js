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
              propertyDivision: "ui.propertyDivision",
              claim: "ui.legalClaim",
              hearing: "ui.courtHearing",
              judgment: "ui.judgment",
              detention: "ui.detention",
              imprisonment: "ui.imprisonment",
              release: "ui.releaseFromCustody",
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
          ["authority", "ui.courtAuthority"],
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
  );
}
