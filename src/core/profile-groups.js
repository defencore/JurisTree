import { localizedConfig } from "../i18n/localized-config.js";
import { translate } from "../i18n/index.js";

/** One information hierarchy for profile editing, section settings and biographies. */
export const profileGroups = localizedConfig(() => {
  return [
    [
      "ui.profileIdentityGroup",
      ["names", "civil", "contacts", "identity", "immigration", "residences"],
    ],
    [
      "ui.profileLifeGroup",
      ["biography", "education", "occupations", "timeline", "military"],
    ],
    ["ui.profilePersonalGroup", ["skills", "personal", "pets"]],
    [
      "ui.profileHealthGroup",
      ["appearance", "medical", "pregnancy", "identityHistory", "death"],
    ],
    [
      "ui.profileLegalGroup",
      ["legal", "custody", "witnesses", "claims", "sanctions", "weapons"],
    ],
    [
      "ui.profileFinancialGroup",
      [
        "assets",
        "finances",
        "accounts",
        "crypto",
        "companies",
        "encumbrances",
        "taxation",
      ],
    ],
    ["ui.profileOtherGroup", ["travel", "political", "custom"]],
  ].map(([label, sections]) => ({ label: translate(label), sections }));
});
export const orderedProfileSections = localizedConfig(() => {
  return profileGroups().flatMap((group) => group.sections);
});
