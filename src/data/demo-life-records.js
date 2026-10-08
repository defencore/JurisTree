import { sourceRecord } from "./records.js";

/** Fictional life events retain the reporter and distinguish reports from verified facts. */
export function populateLifeRecords(project) {
  const p = (id) => project.people.find((person) => person.id === id);
  project.relations.push({
    id: "relationship-roe-blake",
    from: "p4",
    to: "p9",
    type: "partner",
    unionKind: "affair",
    fromDate: "2001-04-01",
    toDate: "2002-06-30",
    status: "ended",
    duration: "temporary",
    verification: "unverified",
    reportedBy: "Riley Cross",
    notes:
      "Reported by Riley Cross; neither person has confirmed the relationship or its dates.",
  });
  project.documents.push(
    sourceRecord({
      id: "interview-cross",
      title: "Interview notes from Riley Cross",
      type: "testimony",
      status: "needs_review",
      evidence: "indirect",
      verification: "pending",
      people: ["p4", "p9", "p11"],
      relations: ["relationship-roe-blake"],
      date: "2026-02-10",
      source: "Interview notes",
      repository: "Research correspondence",
      reference: "RC/2026/0210",
      transcription:
        "Riley Cross reported seeing Jordan Roe and Morgan Blake together during 2001. The notes do not establish the nature of the relationship.",
    }),
  );
  p("p4").claims = [
    {
      id: "reported-affair",
      kind: "infidelity",
      title: "Reported relationship with Morgan Blake",
      relatedPersonId: "p9",
      statement:
        "Riley Cross described a possible relationship during Jordan's marriage to Jamie. The people concerned have not confirmed this account.",
      basis: "hearsay",
      reportedBy: "Riley Cross",
      reportedAt: "2026-02-10",
      verification: "pending",
      sourceId: "interview-cross",
    },
  ];
  p("p4").witnessRecords = [
    {
      id: "witness-cross",
      eventTitle: "Meeting at the Willowbank summer fair",
      eventDate: "2001-06-16",
      eventPlace: "Willowbank Community Centre",
      witnessId: "p11",
      role: "eyewitness",
      statement:
        "Riley Cross reports seeing Jordan Roe and Morgan Blake arrive together. This observation alone does not confirm a romantic relationship.",
      interviewDate: "2026-02-10",
      statementReference: "RC/2026/0210",
      availability: "available",
      basis: "source",
      reportedBy: "Riley Cross",
      recordedAt: "2026-02-10",
      verification: "pending",
      sourceId: "interview-cross",
    },
  ];
  p("p8").pregnancyRecords = [
    {
      id: "pregnancy-drew",
      title: "Pregnancy with Drew",
      outcome: "liveBirth",
      from: "2017-08-14",
      expectedDate: "2018-05-21",
      to: "2018-05-14",
      otherParentId: "p6",
      parentageStatus: "reported",
      childId: "p13",
      gestationWeeks: "39",
      fetuses: "1",
      provider: "Northbridge Health Centre",
      recordNumber: "OB-2018-0514",
      basis: "self",
      reportedBy: "Casey Roe",
      verification: "pending",
    },
  ];
  p("p5").pregnancyRecords = [
    {
      id: "pregnancy-loss",
      title: "Earlier pregnancy",
      outcome: "miscarriage",
      from: "2014-02-01",
      to: "2014-04-12",
      gestationWeeks: "10",
      parentageStatus: "unknown",
      circumstances:
        "Pregnancy loss reported during a personal interview; no clinical document has been supplied.",
      basis: "self",
      reportedBy: "Jesse Ward",
      verification: "pending",
    },
    {
      id: "pregnancy-termination",
      title: "Pregnancy ending in 2016",
      outcome: "termination",
      from: "2016-01-10",
      to: "2016-03-06",
      gestationWeeks: "8",
      parentageStatus: "unknown",
      basis: "self",
      reportedBy: "Jesse Ward",
      verification: "pending",
      notes:
        "Dates are based on the personal account and require confirmation.",
    },
  ];
  p("p1").deathRecords = [
    {
      id: "death-john",
      title: "Death of John Doe",
      date: "2011-11-03",
      category: "illness",
      cause: "Cardiac disease reported by the family",
      country: "Canada",
      place: "Brookfield",
      circumstances: "Died in hospital after a period of illness.",
      authority: "Brookfield Civil Registry",
      certificateNumber: "DC-2011-1103",
      certificateDate: "2011-11-07",
      burialDate: "2011-11-09",
      burialPlace: "Brookfield Memorial Gardens",
      basis: "source",
      reportedBy: "Jamie Roe",
      verification: "pending",
      sourceId: "d4",
      notes:
        "Certificate requested; the reported cause has not been independently checked.",
    },
  ];
  const peter = p("peter-ellis");
  peter.deathRecords = [
    {
      id: "death-peter",
      title: "Reported circumstances of Peter Ellis's death",
      date: peter.death,
      category: "violent",
      country: "Canada",
      circumstances:
        "A relative reported an assault before his death. No investigation report or medical conclusion is held in the archive.",
      conclusion: "Circumstances remain unconfirmed.",
      basis: "source",
      reportedBy: "Lucy Reed",
      verification: "pending",
    },
  ];
  p("p4").militaryRecords = [
    {
      id: "service-jordan",
      title: "Communications service",
      kind: "service",
      country: "Canada",
      branch: "Army",
      unit: "12th Support Battalion",
      role: "Communications specialist",
      rank: "Sergeant",
      from: "1979-07-01",
      to: "1983-06-30",
      status: "completed",
      documentType: "Military service record",
      series: "MR",
      documentNumber: "MR-790184",
      serviceNumber: "SR-601728",
      issuedBy: "Regional Personnel Office",
      issueDate: "1979-07-01",
      registrationOffice: "Brookfield Registration Office",
      specialty: "Radio communications",
      fitnessCategory: "Fit for assigned duty",
      appointmentReference: "PO/1979/184",
      dischargeDate: "1983-06-30",
      dischargeReason: "Completion of service term.",
      basis: "self",
      reportedBy: "Jordan Roe",
      verification: "pending",
    },
    {
      id: "award-jordan",
      title: "Service award",
      kind: "award",
      awardName: "Service Merit Medal",
      awardGrade: "Bronze",
      awardDate: "1982-11-11",
      awardedBy: "Regional Command",
      decreeNumber: "AW/1982/117",
      description:
        "Award reported for communications support during an extended training exercise.",
      basis: "self",
      reportedBy: "Jordan Roe",
      verification: "pending",
    },
  ];
  Object.assign(p("p4").occupations[0], {
    status: "current",
    country: "Canada",
    department: "Community development committee",
    basis: "self",
    reportedBy: "Jordan Roe",
    verification: "pending",
  });
  Object.assign(p("p5").occupations[0], { status: "current" });
  p("p6").occupations = [
    {
      id: "work-robin-former",
      kind: "work",
      organization: "Willowbank Design Studio",
      role: "Junior designer",
      department: "Residential projects",
      country: "Canada",
      from: "2014-07-01",
      to: "2018-06-30",
      status: "former",
      contract: "Full-time employment",
      basis: "self",
      reportedBy: "Robin Roe",
      verification: "pending",
    },
    {
      id: "work-robin-current",
      kind: "work",
      organization: "Cedarline Architects",
      role: "Project designer",
      country: "Canada",
      from: "2019-04-01",
      status: "current",
      appointment: "employed",
      supervisor: "Elaine Porter",
      basis: "self",
      reportedBy: "Robin Roe",
      verification: "pending",
    },
  ];
  p("p5").contacts = [
    {
      id: "contact-jesse-email",
      type: "email",
      label: "Personal email",
      value: "jesse.ward@family.invalid",
      status: "current",
      basis: "self",
      verification: "pending",
    },
    {
      id: "contact-jesse-social",
      type: "social",
      label: "History and museum updates",
      platform: "Circle",
      username: "jesse.ward",
      value: "@jesse.ward",
      url: "https://social.invalid/jesse.ward",
      from: "2019",
      status: "current",
      basis: "self",
      verification: "pending",
    },
  ];
  p("p11").contacts = [
    {
      id: "contact-riley",
      type: "phone",
      label: "Interview contact",
      value: "+1 202 555 0146",
      status: "current",
      verification: "pending",
      basis: "self",
    },
  ];
}
