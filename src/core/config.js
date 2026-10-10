import { localizedConfig } from "../i18n/localized-config.js";
import { theme } from "./theme.js";
import { translate } from "../i18n/index.js";
import { extendedProfileSections } from "./profile-sections/index.js";
import { orderedProfileSections } from "./profile-groups.js";
export const GRAPH_FONT = "DejaVu Sans,Tahoma,Verdana,Arial,sans-serif";
export const CAMERA_MIN_ZOOM = 0.025;
export const CAMERA_MAX_ZOOM = 2.5;
export const types = localizedConfig(() => {
  return {
    birth: translate("ui.birthCertificate"),
    marriage: translate("ui.marriageCertificate"),
    divorce: translate("ui.marriageDissolutionCertificate"),
    adoption: translate("ui.adoptionRecordDocument"),
    parentage: translate("ui.parentageRecordDocument"),
    civil_extract: translate("ui.civilExtract"),
    death: translate("ui.deathCertificate"),
    name_change: translate("ui.nameSurnameChange"),
    will: translate("ui.willAbsenceOfAWill"),
    probate: translate("ui.probateFileRepresentativeAuthority"),
    ownership: translate("ui.ownershipBankDocument"),
    archive: translate("ui.archiveRecord"),
    ledger: translate("ui.ledgerSource"),
    register: translate("ui.registerSource"),
    census: translate("ui.censusResidentRegister"),
    award: translate("ui.awardSource"),
    journal_entry: translate("ui.journalEntrySource"),
    death_notice: translate("ui.deathNoticeSource"),
    photo: translate("ui.photograph"),
    letter: translate("ui.letterCorrespondence"),
    testimony: translate("ui.witnessTestimony"),
    rumor: translate("ui.rumor"),
    recording: translate("ui.recording"),
    other: translate("ui.otherDocument"),
  };
});
export const relTypes = localizedConfig(() => {
  return {
    parent: translate("ui.biologicalParenthood"),
    spouse: translate("ui.registeredMarriage"),
    partner: translate("ui.personalPartnership"),
    sibling: translate("ui.sibling"),
    adopted: translate("ui.adoption"),
    step_parent: translate("ui.stepParenthood"),
    acquaintance: translate("ui.acquaintance"),
    professional: translate("ui.professionalConnection"),
    reports_to: translate("ui.reportsToConnection"),
    sanctions_link: translate("ui.sanctionsConnection"),
    unconfirmed: translate("ui.possibleKinship"),
  };
});
export const statusTypes = localizedConfig(() => {
  return {
    available: translate("ui.available"),
    requested: translate("ui.requested"),
    not_found: translate("ui.notFound"),
    needs_review: translate("ui.needsReview"),
  };
});
export const evidenceTypes = localizedConfig(() => {
  return {
    official: translate("ui.officialSource"),
    indirect: translate("ui.indirectEvidence"),
    unverified: translate("ui.unverifiedSource"),
  };
});
export const PERSON_CARD_WIDTH = 280;
export const PERSON_CARD_HEIGHT = 212;
export const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;
export const docStates = localizedConfig(() => {
  return {
    available: {
      label: translate("ui.documentAvailable"),
      tone: "available",
      icon: "fileCheck",
    },
    requested: {
      label: translate("ui.requested"),
      tone: "requested",
      icon: "fileClock",
    },
    not_found: {
      label: translate("ui.notFound"),
      tone: "missing",
      icon: "fileMissing",
    },
    needs_review: {
      label: translate("ui.review2"),
      tone: "review",
      icon: "search",
    },
  };
});
export const groupColors = [
  theme.blue,
  theme.teal,
  theme["blue-dark"],
  theme.gold,
  theme.red,
  theme.violet,
];
export const sectionInfo = localizedConfig(() => {
  const sections = {
    timeline: [translate("ui.familyDates"), "calendarClock"],
    biography: [translate("ui.biographyAndHistory"), "book"],
    pets: [translate("ui.pets"), "paw"],
    ...Object.fromEntries(
      Object.entries(extendedProfileSections()).map(([key, section]) => [
        key,
        section.info,
      ]),
    ),
  };
  return Object.fromEntries(
    orderedProfileSections().map((key) => [key, sections[key]]),
  );
});
export const recordConfigs = localizedConfig(() => {
  return {
    ...Object.fromEntries(
      Object.entries(extendedProfileSections()).map(([key, section]) => [
        key,
        section.config,
      ]),
    ),
    timeline: {
      key: "events",
      label: translate("ui.event"),
      fields: [
        ["title", translate("ui.event"), "text"],
        ["category", translate("ui.eventType"), "select", eventCategories()],
        ["date", translate("ui.date"), "period"],
        [
          "repeat",
          translate("ui.anniversary"),
          "select",
          {
            none: translate("ui.oneTimeEvent"),
            annual: translate("ui.everyYear"),
          },
        ],
        ["notes", translate("ui.description"), "textarea"],
        ["sourceId", translate("ui.source"), "source"],
      ],
    },
    pets: {
      key: "pets",
      label: translate("ui.pet"),
      fields: [
        ["name", translate("ui.petName"), "text"],
        [
          "type",
          translate("ui.species"),
          "select",
          {
            unspecified: translate("ui.notSpecified"),
            dog: translate("ui.dog"),
            cat: translate("ui.cat"),
            bird: translate("ui.bird"),
            fish: translate("ui.fish"),
            other: translate("ui.other"),
          },
        ],
        ["birth", translate("ui.birth"), "period"],
        ["death", translate("ui.deathIfKnown"), "period"],
        ["notes", translate("ui.breedStoryNotes"), "textarea"],
        ["sourceId", translate("ui.sourcePhoto"), "source"],
      ],
    },
  };
});
export const familyEventTypes = localizedConfig(() => {
  return {
    birth: [translate("ui.birth"), "baby"],
    death: [translate("ui.deathAnniversary"), "heart"],
    custom: [translate("ui.familyDates"), "calendarClock"],
    anniversary: [translate("ui.anniversaries"), "heart"],
    jubilee: [translate("ui.jubilees"), "sparkles"],
    memorial: [translate("ui.memorialDates"), "heart"],
    legal: [translate("ui.legalHistory"), "landmark"],
    custody: [translate("ui.custodyHistory"), "landmark"],
    finance: [translate("ui.financialHistory"), "property"],
    asset: [translate("ui.identifiedAssets"), "property"],
    encumbrance: [translate("ui.assetRestrictions"), "landmark"],
    account: [translate("ui.financialAccounts"), "landmark"],
    crypto: [translate("ui.cryptoAssets"), "property"],
    company: [translate("ui.companiesAndInterests"), "briefcase"],
    sanction: [translate("ui.sanctionsAndAssociations"), "shield"],
    political: [translate("ui.partyAffiliations"), "users"],
    professional: [translate("ui.professionalConnection"), "briefcase"],
    travel: [translate("ui.travelHistory"), "globe"],
    immigration: [translate("ui.citizenshipAndImmigration"), "landmark"],
    civil: [translate("ui.civilRecords"), "landmark"],
    medical: [translate("ui.medicalHistory"), "heartPulse"],
    pregnancy: [translate("ui.pregnancyHistory"), "baby"],
    deathDetails: [translate("ui.deathAndBurial"), "heart"],
    military: [translate("ui.militaryHistory"), "shield"],
    testimony: [translate("ui.witnessesAndTestimony"), "users"],
    weapon: [translate("ui.weaponOwnership"), "shield"],
    skill: [translate("ui.activitiesAndSkills"), "sparkles"],
    education: [translate("ui.education"), "book"],
    personal: [translate("ui.personalPortrait"), "sparkles"],
    residence: [translate("ui.residence"), "mapPin"],
    occupation: [translate("ui.workAndEducation"), "briefcase"],
    pet: [translate("ui.pets"), "paw"],
  };
});
export const eventCategories = localizedConfig(() => {
  return Object.fromEntries(
    ["custom", "anniversary", "jubilee", "memorial"].map((key) => [
      key,
      familyEventTypes()[key][0],
    ]),
  );
});
export const graphStateInfo = localizedConfig(() => {
  return {
    official: [translate("ui.officialSourceAvailable"), theme.teal],
    missing: [translate("ui.evidenceMissing"), theme.amber],
    review: [translate("ui.review2"), theme.violet],
    requested: [translate("ui.requested"), theme.blue],
    indirect: [translate("ui.indirectEvidence"), theme.muted],
    conflict: [translate("ui.disputed"), theme.red],
  };
});
export const graphLineDashes = {
  official: "",
  missing: "7 5",
  review: "7 5",
  requested: "7 5",
  indirect: "3 5",
  conflict: "7 5",
};
export const auxiliaryLineStyles = localizedConfig(() => {
  return {
    source: {
      label: translate("ui.sourceMentionedPerson"),
      color: theme.muted,
      dash: "3 6",
      width: 1.2,
    },
    property: {
      label: translate("ui.propertyPersonSShare"),
      color: theme.teal,
      dash: "4 5",
      width: 1.5,
    },
  };
});
