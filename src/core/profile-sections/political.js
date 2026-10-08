import { translate } from "../../i18n/index.js";
import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function politicalSection() {
  return defineSection(
    "politicalRecords",
    "ui.partyAffiliations",
    "users",
    "ui.partyAffiliationRecord",
    [
      [
        null,
        [
          ["party", "ui.partyName", "text"],
          ["country", "ui.country", "text"],
          [
            "kind",
            "ui.partyConnectionKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              member: "ui.partyMember",
              candidate: "ui.partyCandidate",
              supporter: "ui.partySupporter",
              donor: "ui.partyDonor",
              other: "ui.other",
            },
          ],
          ["role", "ui.partyPosition", "text"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentAffiliation",
              former: "ui.formerAffiliation",
              suspended: "ui.suspendedMembership",
              expelled: "ui.expelledMembership",
              other: "ui.other",
            },
          ],
        ],
      ],
      [
        "ui.partyAffiliationDetails",
        [
          ["abbreviation", "ui.partyAbbreviation", "text"],
          ["branch", "ui.partyBranch", "text"],
          ["membershipNumber", "ui.membershipNumber", "text"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      hint: translate("ui.partyEntryHint"),
      calendar: {
        type: "political",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
        ],
      },
    },
  );
}
