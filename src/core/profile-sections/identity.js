import { defineSection } from "./define.js";

export function identitySection() {
  return defineSection(
    "identityDocuments",
    "ui.identityDocuments",
    "fingerprint",
    "ui.identityDocument",
    [
      [
        null,
        [
          [
            "kind",
            "ui.documentType",
            "select",
            {
              passport: "ui.passport",
              nationalId: "ui.nationalIdentityCard",
              residencePermit: "ui.residencePermit",
              drivingLicense: "ui.drivingLicense",
              birthCertificate: "ui.birthCertificate",
              other: "ui.other",
            },
          ],
          [
            "passportType",
            "ui.passportType",
            "select",
            {
              unspecified: "ui.notSpecified",
              ordinary: "ui.ordinaryPassport",
              diplomatic: "ui.diplomaticPassport",
              service: "ui.servicePassport",
              emergency: "ui.emergencyTravelDocument",
              refugee: "ui.refugeeTravelDocument",
              other: "ui.other",
            },
          ],
          ["issuingCountry", "ui.issuingCountry"],
          ["series", "ui.documentSeries"],
          ["number", "ui.documentNumber"],
        ],
      ],
      [
        "ui.issueAndValidity",
        [
          ["issuedBy", "ui.issuingAuthority"],
          ["authorityCode", "ui.authorityCode"],
          ["issueDate", "ui.issueDate", "date"],
          ["expiryDate", "ui.expiryDate", "date"],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              valid: "ui.validDocument",
              expired: "ui.expiredDocument",
              replaced: "ui.replacedDocument",
              lost: "ui.lostDocument",
              cancelled: "ui.cancelledDocument",
            },
          ],
        ],
      ],
      [
        "ui.holderDetails",
        [
          ["holderName", "ui.nameAsInDocument"],
          ["holderNameLatin", "ui.nameInLatinScript"],
          ["surname", "ui.surnameAsInDocument"],
          ["givenNames", "ui.givenNamesAsInDocument"],
          [
            "sex",
            "ui.sexAsInDocument",
            "select",
            {
              unspecified: "ui.notSpecified",
              m: "ui.male",
              f: "ui.female",
              x: "ui.other",
            },
          ],
          ["citizenship", "ui.citizenship"],
          ["personalNumber", "ui.personalIdentificationNumber"],
          ["birthDate", "ui.birth", "date"],
          ["birthPlace", "ui.placeOfBirth"],
          ["birthCountry", "ui.countryOfBirth"],
          ["registeredAddress", "ui.registeredAddress"],
        ],
      ],
      [
        "ui.machineReadableDetails",
        [
          ["mrzLine1", "ui.mrzLine1"],
          ["mrzLine2", "ui.mrzLine2"],
          ["mrzLine3", "ui.mrzLine3"],
        ],
      ],
      [
        "ui.notesAndSources",
        [
          ["notes", "ui.additionalDetails", "textarea"],
          ["sourceId", "ui.sourceScan", "source"],
        ],
      ],
    ],
    [["issueDate", "expiryDate"]],
  );
}
