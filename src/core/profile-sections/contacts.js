import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function contactsSection() {
  return defineSection(
    "contacts",
    "ui.contactsAndSocialProfiles",
    "phone",
    "ui.contact",
    [
      [
        null,
        [
          [
            "type",
            "ui.type",
            "select",
            {
              phone: "ui.phone",
              email: "ui.emailAddress",
              social: "ui.socialProfile",
              messenger: "ui.messenger",
              website: "ui.website",
              other: "ui.other",
            },
          ],
          ["label", "ui.label"],
          ["value", "ui.numberAddressLink"],
        ],
      ],
      [
        "ui.contactDetails",
        [
          ["platform", "ui.contactPlatform"],
          ["username", "ui.contactUsername"],
          ["url", "ui.profileUrl", "url"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          [
            "status",
            "ui.contactStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              current: "ui.currentContact",
              former: "ui.formerContact",
              unreachable: "ui.unreachableContact",
              other: "ui.other",
            },
          ],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {},
  );
}
