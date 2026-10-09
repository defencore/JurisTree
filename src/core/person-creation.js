/** Each role describes the new person relative to an existing person. */
export const newPersonRoles = {
  child: { label: "ui.newRoleChild", type: "parent", incoming: true },
  parent: { label: "ui.newRoleParent", type: "parent" },
  spouse: { label: "ui.newRoleSpouse", type: "spouse", unionKind: "marriage" },
  partner: { label: "ui.newRolePartner", type: "partner" },
  sibling: { label: "ui.newRoleSibling", type: "sibling" },
  adopted_child: {
    label: "ui.newRoleAdoptedChild",
    type: "adopted",
    incoming: true,
  },
  adoptive_parent: { label: "ui.newRoleAdoptiveParent", type: "adopted" },
  step_child: {
    label: "ui.newRoleStepChild",
    type: "step_parent",
    incoming: true,
  },
  step_parent: { label: "ui.newRoleStepParent", type: "step_parent" },
  acquaintance: { label: "ui.newRoleAcquaintance", type: "acquaintance" },
  professional: { label: "ui.newRoleProfessional", type: "professional" },
  subordinate: { label: "ui.newRoleSubordinate", type: "reports_to" },
  supervisor: {
    label: "ui.newRoleSupervisor",
    type: "reports_to",
    incoming: true,
  },
  sanctions_link: { label: "ui.newRoleSanctionsLink", type: "sanctions_link" },
  unconfirmed: { label: "ui.newRoleUnconfirmed", type: "unconfirmed" },
};
