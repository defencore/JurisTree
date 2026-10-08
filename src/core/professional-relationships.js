/** Professional and sanctions-related connections never establish family ancestry. */
export const professionalRelationshipTypes = [
  "professional",
  "reports_to",
  "sanctions_link",
];

export const professionalRelationshipGroup = [
  "ui.professionalConnectionDetails",
  [
    ["organization", "ui.connectionOrganization"],
    ["department", "ui.department"],
    [
      "professionalKind",
      "ui.professionalConnectionKind",
      "select",
      {
        unspecified: "ui.notSpecified",
        colleagues: "ui.colleagues",
        business: "ui.businessPartners",
        service: "ui.serviceDuties",
        advisory: "ui.advisoryConnection",
        representation: "ui.representativeConnection",
        control: "ui.controlConnection",
        other: "ui.other",
      },
    ],
    [
      "formality",
      "ui.connectionFormality",
      "select",
      {
        unspecified: "ui.notSpecified",
        formal: "ui.formalConnection",
        informal: "ui.informalConnection",
        mixed: "ui.mixedConnection",
      },
    ],
    ["fromRole", "ui.firstPersonRole"],
    ["toRole", "ui.secondPersonRole"],
    ["reference", "ui.connectionReference"],
  ],
];

export const professionalFieldKeys = new Set(
  professionalRelationshipGroup[1].map(([key]) => key),
);

export const isProfessionalRelationship = (type) =>
  professionalRelationshipTypes.includes(type);

export const isDirectedRelationship = (type) =>
  ["parent", "adopted", "step_parent", "reports_to"].includes(type);
