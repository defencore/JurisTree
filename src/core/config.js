import { theme } from "./theme.js";
import { translate } from "../i18n/index.js";
import { extendedProfileSections } from "./profile-sections/index.js";
export const GRAPH_FONT = "DejaVu Sans,Tahoma,Verdana,Arial,sans-serif";
export const CAMERA_MIN_ZOOM = 0.025;
export const CAMERA_MAX_ZOOM = 2.5;
export function types() {
  return {
    birth: translate("ui.birthCertificate"),
    marriage: translate("ui.marriageCertificate"),
    death: translate("ui.deathCertificate"),
    name_change: translate("ui.nameSurnameChange"),
    will: translate("ui.willAbsenceOfAWill"),
    probate: translate("ui.probateFileRepresentativeAuthority"),
    ownership: translate("ui.ownershipBankDocument"),
    archive: translate("ui.archiveRecord"),
    census: translate("ui.censusResidentRegister"),
    photo: translate("ui.photograph"),
    letter: translate("ui.letterCorrespondence"),
    testimony: translate("ui.witnessTestimony"),
    rumor: translate("ui.rumor"),
    recording: translate("ui.recording"),
    other: translate("ui.otherDocument"),
  };
}
export function relTypes() {
  return {
    parent: translate("ui.biologicalParenthood"),
    spouse: translate("ui.registeredMarriage"),
    partner: translate("ui.personalPartnership"),
    sibling: translate("ui.sibling"),
    adopted: translate("ui.adoption"),
    step_parent: translate("ui.stepParenthood"),
    acquaintance: translate("ui.acquaintance"),
    unconfirmed: translate("ui.possibleKinship"),
  };
}
export function statusTypes() {
  return {
    available: translate("ui.available"),
    requested: translate("ui.requested"),
    not_found: translate("ui.notFound"),
    needs_review: translate("ui.needsReview"),
  };
}
export function evidenceTypes() {
  return {
    official: translate("ui.officialSource"),
    indirect: translate("ui.indirectEvidence"),
    unverified: translate("ui.unverifiedSource"),
  };
}
export const PERSON_CARD_WIDTH = 280;
export const PERSON_CARD_HEIGHT = 212;
export const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;
export function docStates() {
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
}
export const groupColors = [
  theme.blue,
  theme.teal,
  theme["blue-dark"],
  theme.gold,
  theme.red,
  theme.violet,
];
export function sectionInfo() {
  return {
    timeline: [translate("ui.eventsAndAnniversaries"), "calendarClock"],
    contacts: [translate("ui.contactsAndSocialProfiles"), "phone"],
    biography: [translate("ui.biographyAndHistory"), "book"],
    interests: [translate("ui.hobbiesAndInterests"), "sparkles"],
    health: [translate("ui.healthInformation"), "heartPulse"],
    pets: [translate("ui.pets"), "paw"],
    ...Object.fromEntries(
      Object.entries(extendedProfileSections()).map(([key, section]) => [
        key,
        section.info,
      ]),
    ),
  };
}
export const defaultScopes = {
  family: [
    "timeline",
    "contacts",
    "residences",
    "biography",
    "occupations",
    "interests",
    "health",
    "pets",
  ],
  inheritance: [],
  property: ["contacts"],
  research: ["timeline", "residences", "biography", "occupations"],
};
export function recordConfigs() {
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
        ["date", translate("ui.date"), "date"],
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
    contacts: {
      key: "contacts",
      label: translate("ui.contact"),
      fields: [
        [
          "type",
          translate("ui.type"),
          "select",
          {
            phone: translate("ui.phone"),
            email: "Email",
            social: translate("ui.socialProfile"),
            website: translate("ui.website"),
            other: translate("ui.other"),
          },
        ],
        ["label", translate("ui.label"), "text"],
        ["value", translate("ui.numberAddressLink"), "text"],
        ["notes", translate("ui.note"), "text"],
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
            dog: translate("ui.dog"),
            cat: translate("ui.cat"),
            bird: translate("ui.bird"),
            fish: translate("ui.fish"),
            other: translate("ui.other"),
          },
        ],
        ["birth", translate("ui.birth"), "date"],
        ["death", translate("ui.deathIfKnown"), "date"],
        ["notes", translate("ui.breedStoryNotes"), "textarea"],
        ["sourceId", translate("ui.sourcePhoto"), "source"],
      ],
    },
  };
}
export function familyEventTypes() {
  return {
    birth: [translate("ui.birth"), "baby"],
    death: [translate("ui.deathAnniversary"), "heart"],
    custom: [translate("ui.eventsAndAnniversaries"), "calendarClock"],
    anniversary: [translate("ui.anniversaries"), "heart"],
    jubilee: [translate("ui.jubilees"), "sparkles"],
    memorial: [translate("ui.memorialDates"), "heart"],
    legal: [translate("ui.legalHistory"), "landmark"],
    finance: [translate("ui.financialHistory"), "property"],
    travel: [translate("ui.travelHistory"), "globe"],
    immigration: [translate("ui.citizenshipAndImmigration"), "landmark"],
    medical: [translate("ui.medicalHistory"), "heartPulse"],
    weapon: [translate("ui.weaponOwnership"), "shield"],
    skill: [translate("ui.skillsHobbies"), "sparkles"],
    education: [translate("ui.education"), "book"],
    residence: [translate("ui.residence"), "mapPin"],
    occupation: [translate("ui.workAndEducation"), "briefcase"],
    pet: [translate("ui.pets"), "paw"],
  };
}
export function eventCategories() {
  return Object.fromEntries(
    ["custom", "anniversary", "jubilee", "memorial", "legal"].map((key) => [
      key,
      familyEventTypes()[key][0],
    ]),
  );
}
export function graphStateInfo() {
  return {
    official: [translate("ui.officialSourceAvailable"), theme.teal],
    missing: [translate("ui.evidenceMissing"), theme.amber],
    review: [translate("ui.review2"), theme.violet],
    requested: [translate("ui.requested"), theme.blue],
    indirect: [translate("ui.indirectEvidence"), theme.muted],
    conflict: [translate("ui.disputed"), theme.red],
  };
}
export function startTemplates() {
  return {
    family: {
      title: translate("ui.familyTree"),
      icon: "tree",
      purpose: "family",
      name: translate("ui.myFamily"),
      description: translate(
        "ui.generationsFamilyGroupsBiographiesEventsAndAFamily",
      ),
      detail: translate("ui.emptyTreeWithAllProfileSectionsAddThe"),
    },
    inheritance: {
      title: translate("ui.inheritance"),
      icon: "landmark",
      purpose: "inheritance",
      name: translate("ui.inheritanceCase"),
      description: translate("ui.routeFromDeceasedOwnerToClaimantDocumentsAnd"),
      detail: translate("ui.emptyMapWithOwnerAndClaimantSelectionAnd"),
    },
    property: {
      title: translate("ui.propertyAndShares"),
      icon: "property",
      purpose: "property",
      name: translate("ui.familyProperty"),
      description: translate(
        "ui.ownersPropertySourcesAndPlannedShareAllocation",
      ),
      detail: translate("ui.emptyMapWithPropertyAndContactsSharesAre"),
    },
    research: {
      title: translate("ui.relationshipResearch"),
      icon: "route",
      purpose: "research",
      name: translate("ui.relationshipResearch"),
      description: translate(
        "ui.personGroupsAcquaintancesHypothesesAndPathsBetweenPeople",
      ),
      detail: translate("ui.emptyNetworkMapWithBiographiesAddressesEventsAnd"),
    },
    blank: {
      title: translate("ui.blankMap"),
      icon: "files",
      purpose: "family",
      name: translate("ui.newMap"),
      description: translate(
        "ui.onlyPeopleRelationshipsAndSourcesAddOtherSections",
      ),
      detail: translate("ui.emptyMapWithoutExtraProfileSectionsChangePurpose"),
    },
  };
}
export const graphLineDashes = {
  official: "",
  missing: "7 5",
  review: "7 5",
  requested: "7 5",
  indirect: "3 5",
  conflict: "7 5",
};
export function auxiliaryLineStyles() {
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
}
