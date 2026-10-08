import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function travelSection() {
  return defineSection(
    "travelRecords",
    "ui.travelHistory",
    "globe",
    "ui.travelRecord",
    [
      [
        null,
        [
          ["title", "ui.label"],
          ["fromCountry", "ui.departureCountry"],
          ["toCountry", "ui.destinationCountry"],
          ["departureDate", "ui.departureDate", "date"],
          ["entryDate", "ui.entryDate", "date"],
          ["exitDate", "ui.exitDate", "date"],
          ["returnDate", "ui.returnDate", "date"],
        ],
      ],
      [
        "ui.journeyDetails",
        [
          [
            "purpose",
            "ui.travelPurpose",
            "select",
            {
              unspecified: "ui.notSpecified",
              tourism: "ui.tourism",
              work: "ui.work",
              study: "ui.education",
              family: "ui.familyVisit",
              relocation: "ui.relocation",
              transit: "ui.transit",
              other: "ui.other",
            },
          ],
          [
            "status",
            "ui.status",
            "select",
            {
              unspecified: "ui.notSpecified",
              planned: "ui.planned",
              completed: "ui.completedCase",
              cancelled: "ui.cancelled",
              other: "ui.other",
            },
          ],
          ["fromCity", "ui.departureCity"],
          ["toCity", "ui.destinationCity"],
          ["borderPoint", "ui.borderCrossing"],
          ["transport", "ui.transportRoute"],
          ["passportReference", "ui.passportReference"],
          ["permitReference", "ui.visaPermitReference"],
          ["address", "ui.residentialAddress"],
          ["description", "ui.description", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [
      ["departureDate", "entryDate"],
      ["entryDate", "exitDate"],
      ["exitDate", "returnDate"],
      ["departureDate", "returnDate"],
      ["departureDate", "exitDate"],
      ["entryDate", "returnDate"],
    ],
    {
      calendar: {
        type: "travel",
        dates: [
          ["departureDate", "ui.departureDate"],
          ["entryDate", "ui.entryDate"],
          ["exitDate", "ui.exitDate"],
          ["returnDate", "ui.returnDate"],
        ],
      },
    },
  );
}
