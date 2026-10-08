import { translate } from "../i18n/index.js";
export const GRAPH_FONT = "DejaVu Sans,Tahoma,Verdana,Arial,sans-serif";
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
    other: translate("ui.otherDocument"),
  };
}
export function relTypes() {
  return {
    parent: translate("ui.parenthood"),
    spouse: translate("ui.marriagePartnership"),
    sibling: translate("ui.sibling"),
    adopted: translate("ui.adoption"),
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
export const PERSON_CARD_WIDTH = 250;
export const PERSON_CARD_HEIGHT = 158;
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
  "#6e5cce",
  "#248972",
  "#4c7ab7",
  "#b48039",
  "#ad6080",
  "#5a8c9b",
];
export function sectionInfo() {
  return {
    timeline: [translate("ui.eventsAndAnniversaries"), "calendarClock"],
    contacts: [translate("ui.contactsAndSocialProfiles"), "phone"],
    residences: [translate("ui.addressHistory"), "mapPin"],
    biography: [translate("ui.biographyAndHistory"), "book"],
    occupations: [translate("ui.workEducationService"), "briefcase"],
    interests: [translate("ui.hobbiesAndInterests"), "sparkles"],
    health: [translate("ui.healthInformation"), "heartPulse"],
    pets: [translate("ui.pets"), "paw"],
  };
}
export const defaultScopes = {
  family: Object.keys(sectionInfo()),
  inheritance: [],
  property: ["contacts"],
  research: ["timeline", "residences", "biography", "occupations"],
};
export function recordConfigs() {
  return {
    timeline: {
      key: "events",
      label: translate("ui.event"),
      fields: [
        ["title", translate("ui.event"), "text"],
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
    residences: {
      key: "residences",
      label: translate("ui.address"),
      fields: [
        ["address", translate("ui.residentialAddress"), "text"],
        ["from", translate("ui.from"), "period"],
        ["to", translate("ui.to"), "period"],
        ["notes", translate("ui.note"), "textarea"],
        ["sourceId", translate("ui.source"), "source"],
      ],
    },
    occupations: {
      key: "occupations",
      label: translate("ui.workplaceSchool"),
      fields: [
        ["organization", translate("ui.institutionOrganization"), "text"],
        ["role", translate("ui.positionSpecialty"), "text"],
        [
          "kind",
          translate("ui.type"),
          "select",
          {
            work: translate("ui.work"),
            education: translate("ui.education"),
            service: translate("ui.service"),
            other: translate("ui.other"),
          },
        ],
        ["from", translate("ui.from"), "period"],
        ["to", translate("ui.to"), "period"],
        ["location", translate("ui.place"), "text"],
        ["notes", translate("ui.notes"), "textarea"],
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
    death: [translate("ui.memorialDates"), "heart"],
    custom: [translate("ui.eventsAndAnniversaries"), "calendarClock"],
    residence: [translate("ui.residence"), "mapPin"],
    occupation: [translate("ui.workAndEducation"), "briefcase"],
    pet: [translate("ui.pets"), "paw"],
  };
}
export function graphStateInfo() {
  return {
    official: [translate("ui.officialSourceAvailable"), "#287454"],
    missing: [translate("ui.evidenceMissing"), "#a6751e"],
    review: [translate("ui.review2"), "#765ca3"],
    requested: [translate("ui.requested"), "#3f6f97"],
    indirect: [translate("ui.indirectEvidence"), "#758394"],
    conflict: [translate("ui.disputed"), "#a24b56"],
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
      color: "#758897",
      dash: "3 6",
      width: 1.2,
    },
    property: {
      label: translate("ui.propertyPersonSShare"),
      color: "#648575",
      dash: "4 5",
      width: 1.5,
    },
  };
}
