import { orderedProfileSections } from "./profile-groups.js";
import { translate } from "../i18n/index.js";

const definitions = {
  family: {
    messages: [
      "ui.modeFamily",
      "ui.modeNameFamily",
      "ui.modeDescriptionFamily",
    ],
    icon: "tree",
    familyGroups: true,
    sections: [
      "names",
      "civil",
      "timeline",
      "contacts",
      "residences",
      "biography",
      "occupations",
      "education",
      "interests",
      "skills",
      "personal",
      "health",
      "pets",
    ],
  },
  civil: {
    messages: ["ui.modeCivil", "ui.modeNameCivil", "ui.modeDescriptionCivil"],
    icon: "fingerprint",
    familyGroups: true,
    view: "people",
    sections: [
      "names",
      "civil",
      "identity",
      "contacts",
      "immigration",
      "residences",
      "death",
    ],
  },
  inheritance: {
    messages: [
      "ui.modeInheritance",
      "ui.modeNameInheritance",
      "ui.modeDescriptionInheritance",
    ],
    icon: "landmark",
    familyGroups: true,
    sections: [
      "names",
      "civil",
      "identity",
      "contacts",
      "death",
      "legal",
      "assets",
      "encumbrances",
      "claims",
    ],
  },
  property: {
    messages: [
      "ui.modeProperty",
      "ui.modeNameProperty",
      "ui.modeDescriptionProperty",
    ],
    icon: "property",
    propertyMap: true,
    sections: ["contacts", "assets", "encumbrances", "companies", "finances"],
  },
  research: {
    messages: [
      "ui.modeResearch",
      "ui.modeNameResearch",
      "ui.modeDescriptionResearch",
    ],
    icon: "route",
    layout: "network",
    sections: [
      "names",
      "civil",
      "contacts",
      "residences",
      "biography",
      "education",
      "occupations",
      "legal",
      "custody",
      "witnesses",
      "claims",
    ],
  },
  profiling: {
    messages: [
      "ui.modeProfiling",
      "ui.modeNameProfiling",
      "ui.modeDescriptionProfiling",
    ],
    icon: "user",
    view: "people",
    layout: "network",
    sections: orderedProfileSections(),
  },
  legal: {
    messages: ["ui.modeLegal", "ui.modeNameLegal", "ui.modeDescriptionLegal"],
    icon: "landmark",
    view: "events",
    eventDomain: "legal",
    eventMode: "history",
    layout: "network",
    sections: [
      "names",
      "civil",
      "identity",
      "contacts",
      "legal",
      "custody",
      "witnesses",
      "claims",
      "encumbrances",
      "sanctions",
    ],
  },
  financial: {
    messages: [
      "ui.modeFinancial",
      "ui.modeNameFinancial",
      "ui.modeDescriptionFinancial",
    ],
    icon: "briefcase",
    view: "property",
    propertyMap: true,
    layout: "network",
    sections: [
      "contacts",
      "identity",
      "occupations",
      "assets",
      "finances",
      "accounts",
      "crypto",
      "companies",
      "encumbrances",
      "taxation",
      "sanctions",
      "claims",
    ],
  },
};

export const defaultScopes = Object.freeze(
  Object.fromEntries(
    Object.entries(definitions).map(([key, mode]) => [
      key,
      Object.freeze(mode.sections),
    ]),
  ),
);

/** Source visibility semantics are independent of the archive format version. */
export const modeVisibilityVersion = 2;

/** Empty visibility means all modes, including modes added in future releases. */
export function normalizeModePurposes(
  purposes,
  { legacyDefault = false } = {},
) {
  if (!Array.isArray(purposes) || !purposes.length) return [];
  const selected = [
    ...new Set(purposes.filter((key) => Object.hasOwn(definitions, key))),
  ];
  const originalModes = ["family", "inheritance", "property", "research"];
  if (
    !selected.length ||
    selected.length === Object.keys(definitions).length ||
    (legacyDefault &&
      selected.length === originalModes.length &&
      originalModes.every((key) => selected.includes(key)))
  )
    return [];
  return selected;
}

/** One registry supplies launch templates, mode controls and source visibility labels. */
export function workspaceModes() {
  return Object.fromEntries(
    Object.entries(definitions).map(([key, mode]) => [
      key,
      {
        ...mode,
        purpose: key,
        title: translate(mode.messages[0]),
        name: translate(mode.messages[1]),
        description: translate(mode.messages[2]),
        detail: translate("ui.modeStartHint"),
      },
    ]),
  );
}

export function startTemplates() {
  return {
    ...workspaceModes(),
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
