import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function custodySection() {
  return defineSection(
    "custodyRecords",
    "ui.custodyHistory",
    "landmark",
    "ui.custodyRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.custodyType",
            "select",
            {
              detention: "ui.detention",
              pretrial: "ui.pretrialCustody",
              imprisonment: "ui.imprisonment",
              houseArrest: "ui.houseArrest",
              release: "ui.releaseFromCustody",
              other: "ui.other",
            },
          ],
          ["title", "ui.label"],
          ["from", "ui.custodyFrom", "period"],
          ["to", "ui.custodyTo", "period"],
          ["facility", "ui.custodyFacility"],
          ["location", "ui.facilityAddress"],
          ["country", "ui.country"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              pending: "ui.pendingCase",
              ongoing: "ui.currentCustody",
              completed: "ui.custodyCompleted",
              appealed: "ui.appealedCase",
              other: "ui.other",
            },
          ],
        ],
      ],
      [
        "ui.custodyCaseDetails",
        [
          ["caseNumber", "ui.caseNumber"],
          ["proceedingNumber", "ui.proceedingNumber"],
          ["authority", "ui.courtAuthority"],
          ["date", "ui.custodyDecisionDate", "period"],
          ["decisionReference", "ui.decisionReference"],
          ["decisionUrl", "ui.decisionUrl", "url"],
          ["legalProvision", "ui.chargeProvisions"],
          ["convictionProvision", "ui.convictionProvisions"],
          ["charges", "ui.chargeDescription", "textarea"],
          [
            "role",
            "ui.personRole",
            "select",
            {
              unspecified: "ui.notSpecified",
              detained: "ui.detainedPerson",
              convicted: "ui.convictedPerson",
              suspect: "ui.suspect",
              defendant: "ui.defendantParty",
              claimant: "ui.claimantParty",
              witness: "ui.witness",
              victim: "ui.victim",
              other: "ui.other",
            },
          ],
          ["counterpartyId", "ui.otherPartyInTree", "person"],
          ["counterparty", "ui.otherPartyOutsideTree"],
        ],
      ],
      [
        "ui.sentenceAndRelease",
        [
          ["sentence", "ui.imposedSentence"],
          ["terms", "ui.sentenceConditions", "textarea"],
          ["creditedTime", "ui.creditedCustodyTime"],
          ["releasedAt", "ui.actualReleaseDate", "period"],
          ["releaseGrounds", "ui.releaseGrounds", "textarea"],
          ["outcome", "ui.decisionOutcome", "textarea"],
          ["fineAmount", "ui.fineAmount", "number"],
          ["fineCurrency", "ui.currency"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["from", "to"],
      ["from", "releasedAt"],
    ],
    {
      calendar: {
        type: "custody",
        dates: [
          ["date", "ui.custodyDecisionDate"],
          ["from", "ui.custodyFrom"],
          ["to", "ui.custodyTo"],
          ["releasedAt", "ui.actualReleaseDate"],
        ],
      },
    },
  );
}
