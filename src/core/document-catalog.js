import { localizedConfig } from "../i18n/localized-config.js";
import { translate as t } from "../i18n/index.js";

/** One catalogue defines document types, categories and presentation throughout the app. */
const definitions = [
  ["kinship_document", "civil", "ui.evidenceKinshipDocument", "users"],
  [
    "inheritance_certificate",
    "contracts",
    "ui.evidenceInheritanceCertificate",
    "scan",
  ],
  ["estate_inventory", "contracts", "ui.evidenceEstateInventory", "scan"],
  ["custody_inventory", "archives", "ui.evidenceCustodyInventory", "archive"],
  ["medical_record", "health", "ui.evidenceMedicalRecord", "file"],
  ["witness_list", "legal", "ui.evidenceWitnessList", "users"],
  ["company_extract", "financial", "ui.evidenceCompanyExtract", "landmark"],
  ["birth", "civil", "ui.birthCertificate", "users"],
  ["marriage", "civil", "ui.marriageCertificate", "users"],
  ["divorce", "civil", "ui.marriageDissolutionCertificate", "users"],
  ["death", "civil", "ui.deathCertificate", "users"],
  ["name_change", "civil", "ui.nameSurnameChange", "users"],
  ["adoption", "civil", "ui.adoptionRecordDocument", "users"],
  ["parentage", "civil", "ui.parentageRecordDocument", "users"],
  ["civil_extract", "civil", "ui.civilExtract", "users"],
  ["certificate", "civil", "ui.sourceTypeCertificate", "users"],
  ["passport", "identity", "ui.sourceTypePassport", "fingerprint"],
  ["travel_passport", "identity", "ui.sourceTypeTravelPassport", "fingerprint"],
  ["national_id", "identity", "ui.sourceTypeNationalId", "fingerprint"],
  ["driving_license", "identity", "ui.sourceTypeDrivingLicense", "fingerprint"],
  [
    "residence_permit",
    "identity",
    "ui.sourceTypeResidencePermit",
    "fingerprint",
  ],
  ["permit", "identity", "ui.sourceTypePermit", "fingerprint"],
  ["license", "identity", "ui.sourceTypeLicense", "fingerprint"],
  [
    "vehicle_registration",
    "identity",
    "ui.sourceTypeVehicleRegistration",
    "fingerprint",
  ],
  [
    "residence_registration",
    "residence",
    "ui.sourceTypeResidenceRegistration",
    "home",
  ],
  ["residence_extract", "residence", "ui.sourceTypeResidenceExtract", "home"],
  ["census", "residence", "ui.censusResidentRegister", "home"],
  ["ownership", "property", "ui.sourceTypeOwnership", "property"],
  [
    "property_registry_extract",
    "property",
    "ui.sourceTypePropertyRegistryExtract",
    "property",
  ],
  [
    "prohibition_extract",
    "property",
    "ui.sourceTypeProhibitionExtract",
    "property",
  ],
  ["mortgage_extract", "property", "ui.sourceTypeMortgageExtract", "property"],
  [
    "encumbrance_extract",
    "property",
    "ui.sourceTypeEncumbranceExtract",
    "property",
  ],
  ["cadastre_extract", "property", "ui.sourceTypeCadastreExtract", "property"],
  [
    "property_registration",
    "property",
    "ui.sourceTypePropertyRegistration",
    "property",
  ],
  [
    "technical_passport",
    "property",
    "ui.sourceTypeTechnicalPassport",
    "property",
  ],
  ["contract", "contracts", "ui.sourceTypeContract", "scan"],
  ["gift_contract", "contracts", "ui.sourceTypeGiftContract", "scan"],
  ["sale_contract", "contracts", "ui.sourceTypeSaleContract", "scan"],
  ["lease_contract", "contracts", "ui.sourceTypeLeaseContract", "scan"],
  ["mortgage_contract", "contracts", "ui.sourceTypeMortgageContract", "scan"],
  ["power_of_attorney", "contracts", "ui.sourceTypePowerOfAttorney", "scan"],
  ["will", "contracts", "ui.willAbsenceOfAWill", "scan"],
  ["probate", "contracts", "ui.probateFileRepresentativeAuthority", "scan"],
  ["court_decision", "legal", "ui.sourceTypeCourtDecision", "landmark"],
  ["court_order", "legal", "ui.sourceTypeCourtOrder", "landmark"],
  ["court_claim", "legal", "ui.sourceTypeCourtClaim", "landmark"],
  [
    "enforcement_document",
    "legal",
    "ui.sourceTypeEnforcementDocument",
    "landmark",
  ],
  ["application", "legal", "ui.sourceTypeApplication", "landmark"],
  ["tax_card", "financial", "ui.sourceTypeTaxCard", "landmark"],
  [
    "tax_registration_form",
    "financial",
    "ui.sourceTypeTaxRegistrationForm",
    "landmark",
  ],
  ["tax_declaration", "financial", "ui.sourceTypeTaxDeclaration", "landmark"],
  [
    "income_certificate",
    "financial",
    "ui.sourceTypeIncomeCertificate",
    "landmark",
  ],
  ["bank_account", "financial", "ui.sourceTypeBankAccount", "landmark"],
  ["bank_statement", "financial", "ui.sourceTypeBankStatement", "landmark"],
  [
    "education_document",
    "education",
    "ui.sourceTypeEducationDocument",
    "briefcase",
  ],
  [
    "employment_document",
    "education",
    "ui.sourceTypeEmploymentDocument",
    "briefcase",
  ],
  [
    "military_document",
    "education",
    "ui.sourceTypeMilitaryDocument",
    "briefcase",
  ],
  ["award", "education", "ui.awardSource", "briefcase"],
  ["archive", "archives", "ui.archiveRecord", "archive"],
  ["ledger", "archives", "ui.ledgerSource", "archive"],
  ["register", "archives", "ui.registerSource", "archive"],
  ["journal_entry", "archives", "ui.journalEntrySource", "archive"],
  ["death_notice", "archives", "ui.deathNoticeSource", "archive"],
  ["photo", "archives", "ui.photograph", "archive"],
  ["letter", "archives", "ui.letterCorrespondence", "archive"],
  ["testimony", "archives", "ui.witnessTestimony", "archive"],
  ["rumor", "archives", "ui.rumor", "archive"],
  ["recording", "archives", "ui.recording", "archive"],
  ["other", "archives", "ui.otherDocument", "archive"],
];

export const documentCatalog = localizedConfig(() =>
  Object.fromEntries(
    definitions.map(([type, category, label, icon]) => [
      type,
      { type, category, label: t(label), icon },
    ]),
  ),
);
export const documentTypes = localizedConfig(() =>
  Object.fromEntries(
    Object.entries(documentCatalog()).map(([type, item]) => [type, item.label]),
  ),
);
export const documentCategories = localizedConfig(() =>
  Object.fromEntries(
    Object.entries({
      civil: "ui.sourceGroupCivil",
      identity: "ui.sourceGroupIdentity",
      residence: "ui.sourceGroupResidence",
      property: "ui.sourceGroupProperty",
      contracts: "ui.sourceGroupContracts",
      legal: "ui.sourceGroupLegal",
      financial: "ui.sourceGroupFinancial",
      health: "ui.sourceGroupHealth",
      education: "ui.sourceGroupEducation",
      archives: "ui.sourceGroupArchives",
    }).map(([key, label]) => [key, t(label)]),
  ),
);

export function documentCategory(source) {
  return documentCatalog()[source.type]?.category || "archives";
}
