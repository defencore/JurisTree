import { translate } from "../../i18n/index.js";
import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

/** Registration, issued documents and later annotations remain separate observations. */
export function civilSection() {
  return defineSection(
    "civilRecords",
    "ui.civilRecords",
    "landmark",
    "ui.civilRecord",
    [
      [
        null,
        [
          [
            "kind",
            "ui.civilActType",
            "select",
            {
              birth: "ui.birth",
              marriage: "ui.registeredMarriage",
              divorce: "ui.marriageDissolution",
              nameChange: "ui.nameSurnameChange",
              death: "ui.death",
              adoption: "ui.adoption",
              parentage: "ui.parentageEstablishment",
              parentalRights: "ui.parentalRights",
              other: "ui.other",
            },
          ],
          ["eventDate", "ui.eventDate", "period"],
          ["actNumber", "ui.civilActNumber"],
          ["registeredAt", "ui.civilRegistrationDate", "period"],
          ["authority", "ui.civilRegistrationAuthority"],
          ["country", "ui.country"],
        ],
      ],
      [
        "ui.civilRegistrationDetails",
        [
          ["registryNumber", "ui.civilRegistryNumber"],
          [
            "status",
            "ui.civilRecordStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              active: "ui.civilActive",
              amended: "ui.civilAmended",
              restored: "ui.civilRestored",
              annulled: "ui.civilAnnulled",
              archived: "ui.civilArchived",
              absent: "ui.civilAbsent",
            },
          ],
          ["registrar", "ui.civilRegistrar"],
          ["registrationPlace", "ui.placeOfRegistration"],
        ],
      ],
      [
        "ui.civilSubjectDetails",
        [
          ["surname", "ui.surnameAsInDocument"],
          ["givenName", "ui.givenName"],
          ["patronymic", "ui.patronymic"],
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
          ["birthDate", "ui.birth", "period"],
          ["birthPlace", "ui.placeOfBirth"],
          ["citizenship", "ui.citizenship"],
          ["registeredAddress", "ui.registeredAddress"],
        ],
      ],
      [
        "ui.civilParticipants",
        [
          ["motherId", "ui.civilMother", "person"],
          ["motherName", "ui.civilMotherName"],
          ["fatherId", "ui.civilFather", "person"],
          ["fatherName", "ui.civilFatherName"],
          ["partnerId", "ui.civilSpouse", "person"],
          ["partnerName", "ui.civilSpouseName"],
          ["childId", "ui.civilChild", "person"],
          ["childName", "ui.civilChildName"],
          ["adoptiveMotherId", "ui.adoptiveMother", "person"],
          ["adoptiveFatherId", "ui.adoptiveFather", "person"],
          ["parentageBasis", "ui.civilParentageBasis"],
          ["relationshipId", "ui.civilRelationship", "relationship"],
        ],
      ],
      [
        "ui.civilIssuedDocument",
        [
          [
            "documentKind",
            "ui.civilDocumentKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              certificate: "ui.civilCertificate",
              repeat: "ui.civilRepeatCertificate",
              extract: "ui.civilExtract",
              fullExtract: "ui.civilFullExtract",
              absent: "ui.civilAbsenceExtract",
              other: "ui.other",
            },
          ],
          ["documentSeries", "ui.documentSeries"],
          ["documentNumber", "ui.documentNumber"],
          ["documentIssuedAt", "ui.issueDate", "period"],
          ["documentAuthority", "ui.issuingAuthority"],
          ["extractNumber", "ui.civilExtractNumber"],
        ],
      ],
      [
        "ui.civilAmendments",
        [
          ["previousName", "ui.civilPreviousName"],
          ["newName", "ui.civilNewName"],
          ["amendmentDate", "ui.civilAmendmentDate", "period"],
          [
            "amendmentType",
            "ui.civilAmendmentType",
            "select",
            {
              unspecified: "ui.notSpecified",
              correction: "ui.civilCorrection",
              restoration: "ui.civilRestored",
              annulment: "ui.civilAnnulled",
              adoption: "ui.adoption",
              deprivation: "ui.parentalRightsDeprivation",
              reinstatement: "ui.parentalRightsReinstatement",
              other: "ui.other",
            },
          ],
          ["grounds", "ui.civilGrounds", "textarea"],
          ["decisionAuthority", "ui.courtAuthority"],
          ["decisionReference", "ui.decisionReference"],
          ["relatedActReference", "ui.civilRelatedAct"],
          ["annotations", "ui.civilAnnotations", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["eventDate", "registeredAt"]],
    {
      hint: translate("ui.civilRecordHint"),
      calendar: {
        type: "civil",
        titleFields: ["kind", "actNumber"],
        dates: [
          ["eventDate", "ui.eventDate"],
          ["registeredAt", "ui.civilRegistrationDate"],
          ["amendmentDate", "ui.civilAmendmentDate"],
        ],
      },
    },
  );
}
