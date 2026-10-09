import { translate } from "../i18n/index.js";

const domains = {
  family: [
    "birth",
    "death",
    "custom",
    "anniversary",
    "jubilee",
    "memorial",
    "pet",
  ],
  biography: [
    "civil",
    "travel",
    "immigration",
    "medical",
    "pregnancy",
    "deathDetails",
    "military",
    "weapon",
    "skill",
    "personal",
    "education",
    "residence",
    "occupation",
    "political",
    "professional",
  ],
  legal: ["legal", "custody", "testimony", "sanction"],
  financial: [
    "finance",
    "asset",
    "encumbrance",
    "account",
    "crypto",
    "company",
  ],
};

export function eventDomains() {
  return {
    family: translate("ui.familyDates"),
    biography: translate("ui.lifeChronology"),
    legal: translate("ui.legalChronology"),
    financial: translate("ui.financialChronology"),
  };
}
export function eventDomain(type) {
  return Object.keys(domains).find((domain) => domains[domain].includes(type));
}
export function eventTypesInDomain(types, domain) {
  return Object.fromEntries(
    Object.entries(types).filter(([type]) => eventDomain(type) === domain),
  );
}
export function canRepeatAnnually(type) {
  return eventDomain(type) === "family";
}
export function isMilestone(event, years) {
  return (
    event.type === "jubilee" ||
    (event.annual &&
      !event.memorial &&
      ["birth", "anniversary"].includes(event.type) &&
      years > 0 &&
      years % 5 === 0)
  );
}
