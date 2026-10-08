/** Every amount, institution, identifier and personal description below is fictional. */
export function populateDemoRecords(project) {
  const p = (id) => project.people.find((p) => p.id === id);
  p("p9").notes +=
    " Kept the birth surname Blake during and after marriage to Taylor Ward.";
  p("p3").notes +=
    " Biological mother of Jesse; adoptive mother of Robin. Maiden surname Doe; current surname Roe after marrying Jordan.";
  p("p4").notes +=
    " Born Jordan Roe. Adoptive father of Robin and stepfather of Jesse; Jesse's biological father is Taylor Ward.";
  p("p5").notes +=
    " Jesse and Casey share biological father Taylor Ward and have different biological mothers.";
  p("p6").notes +=
    " Biological mother Quinn Vale; adopted by Jamie and Jordan Roe in 1996.";
  p("p5").biography =
    "Museum researcher specialising in local history and family archives. Born Jesse Ward to Jamie Doe and Taylor Ward. Retained the surname Ward after her mother married Jordan Roe. Works with historical collections and volunteers at a community history group.";
  p("p5").educationRecords = [
    {
      id: "demo-education",
      institution: "Riverside Arts College",
      qualification: "Master's degree",
      field: "History",
      from: "2006-09-01",
      to: "2011-06-30",
      graduatedAt: "2011-06-30",
      status: "completed",
      diplomaNumber: "HC-2011-0482",
    },
  ];
  p("p5").occupations = [
    {
      id: "demo-work",
      kind: "work",
      organization: "Harbour City Museum",
      role: "Research curator",
      from: "2012-09-01",
      appointment: "employed",
      income: "3200",
      currency: "CAD",
      payPeriod: "monthly",
      notes: "Permanent appointment in the collections department.",
    },
  ];
  p("p4").occupations = [
    {
      id: "demo-office",
      kind: "office",
      organization: "Brookfield Town Council",
      role: "Council member",
      from: "2018-10-01",
      appointment: "elected",
      rank: "Ward councillor",
      income: "1500",
      currency: "CAD",
      payPeriod: "monthly",
      reference: "TC/2018/047",
    },
  ];
  p("p5").identityDocuments = [
    {
      id: "demo-passport",
      kind: "passport",
      passportType: "ordinary",
      issuingCountry: "Canada",
      series: "PA",
      number: "PA7314062",
      issuedBy: "Passport Office",
      issueDate: "2024-01-01",
      expiryDate: "2034-01-01",
      notes: "Name on passport: Jesse Ward.",
    },
  ];
  p("p5").immigrationRecords = [
    {
      id: "demo-permit",
      country: "United Kingdom",
      status: "temporary",
      permitNumber: "RP-248163",
      from: "2024-01-01",
      to: "2027-01-01",
      notes: "Temporary residence authorisation for research work.",
    },
  ];
  p("p5").taxRecords = [
    {
      id: "demo-tax",
      country: "Canada",
      year: "2025",
      taxId: "721684309",
      income: "38400",
      taxPaid: "4000",
      currency: "CAD",
      notes: "Employment income declared for the calendar year.",
    },
  ];
  p("p5").personalRecords = [
    {
      id: "demo-habit",
      category: "habits",
      title: "Reading",
      description: "Reads historical novels in the evening.",
      basis: "self",
      reportedBy: "Jesse Ward",
      recordedAt: "2026-01-01",
    },
  ];
  p("p5").events = [
    {
      id: "demo-family-gathering",
      category: "anniversary",
      title: "Annual family gathering",
      date: "2020-10-20",
      repeat: "annual",
      notes: "Relatives meet for lunch and update the family archive.",
    },
    {
      id: "demo-jubilee",
      category: "jubilee",
      title: "Museum jubilee",
      date: "2026-10-25",
      repeat: "none",
      notes: "Fortieth anniversary of the museum opening.",
    },
  ];
  p("p4").legalRecords = [
    {
      id: "demo-property-case",
      kind: "propertyDivision",
      title: "Property division with Riley Cross",
      date: "2022-10-12",
      caseNumber: "CV-2022-1047",
      authority: "Brookfield District Court",
      role: "claimant",
      counterpartyId: "p11",
      status: "completed",
      outcome:
        "Settlement allocated the house to Jordan Roe and provided a balancing payment to Riley Cross.",
      verification: "corroborated",
      basis: "source",
      sourceId: "d6",
    },
  ];
  p("p11").legalRecords = [
    {
      id: "demo-custody",
      kind: "imprisonment",
      title: "Reported custody period",
      from: "2016-01-15",
      to: "2018-01-15",
      authority: "Regional correctional administration",
      role: "convicted",
      status: "completed",
      verification: "pending",
      reportedBy: "Martin Keene",
      notes:
        "Dates and legal disposition reported by Martin Keene; archive confirmation is outstanding.",
      sourceId: "d9",
    },
  ];
  p("p5").financialRecords = [
    {
      id: "demo-gift",
      kind: "gift",
      title: "Gift from Riley Cross",
      amount: "250",
      currency: "CAD",
      date: "2025-12-15",
      direction: "received",
      counterpartyId: "p11",
      status: "settled",
      verification: "corroborated",
      sourceId: "d8",
    },
    {
      id: "demo-loan",
      kind: "loan",
      title: "Family loan",
      amount: "5000",
      currency: "CAD",
      date: "2024-11-01",
      dueDate: "2026-11-01",
      direction: "borrowed",
      counterpartyId: "p4",
      interestRate: "0",
      status: "active",
      verification: "corroborated",
      reference: "LN-2024-018",
    },
    {
      id: "demo-deposit",
      kind: "deposit",
      title: "Term deposit",
      amount: "10000",
      currency: "CAD",
      date: "2026-02-15",
      dueDate: "2027-02-15",
      direction: "held",
      institution: "Northbank Credit Union",
      interestRate: "3",
      status: "active",
      verification: "pending",
    },
    {
      id: "demo-investment",
      kind: "investment",
      title: "Balanced investment portfolio",
      amount: "2500",
      currency: "CAD",
      date: "2025-04-01",
      direction: "held",
      institution: "Cedar Growth Fund",
      status: "active",
      verification: "pending",
      notes: "Quarterly account statement requested.",
    },
  ];
  p("p8").financialRecords = [
    {
      id: "demo-debt",
      kind: "debt",
      title: "Obligation to Jesse Ward",
      amount: "500",
      currency: "CAD",
      direction: "payable",
      counterpartyId: "p5",
      dueDate: "2026-12-01",
      status: "active",
      collateral: "Unsecured.",
      verification: "pending",
    },
  ];
  p("p10").identityHistory = [
    {
      id: "demo-orientation-1",
      kind: "orientation",
      title: "Earlier self-description",
      value: "Bisexual",
      from: "2015",
      to: "2020",
      basis: "self",
      verification: "pending",
      sourceId: "d7",
    },
    {
      id: "demo-orientation-2",
      kind: "orientation",
      title: "Current self-description",
      value: "Pansexual",
      from: "2020",
      basis: "self",
      verification: "pending",
      sourceId: "d7",
    },
    {
      id: "demo-gender",
      kind: "gender",
      title: "Gender identity",
      value: "Nonbinary",
      from: "2019",
      basis: "self",
      verification: "pending",
      sourceId: "d7",
    },
    {
      id: "demo-hormones",
      kind: "hormones",
      title: "Hormone treatment history",
      from: "2021-03-01",
      to: "2022-03-01",
      provider: "Northbridge Health Centre",
      basis: "self",
      verification: "pending",
      notes:
        "Self-reported treatment period; clinical records have not been supplied.",
    },
    {
      id: "demo-surgery",
      kind: "surgery",
      title: "Reported surgical procedure",
      date: "2023-05-10",
      provider: "Northbridge Health Centre",
      description:
        "Procedure reported during an interview; clinical details were not provided.",
      basis: "self",
      verification: "pending",
    },
  ];
  p("p5").claims = [
    {
      id: "demo-rumor",
      kind: "rumor",
      title: "Reported earlier relationship",
      statement:
        "Martin Keene reported an earlier relationship with Avery Hale; confirmation from the people concerned is outstanding.",
      reportedBy: "Martin Keene",
      verification: "pending",
      basis: "hearsay",
      sourceId: "d9",
    },
  ];
  project.property = [
    {
      id: "demo-house",
      title: "Family house at 18 Willow Lane",
      ownerId: "p4",
      value: 200000,
      currency: "CAD",
      allocations: [
        { personId: "p5", percent: 50 },
        { personId: "p6", percent: 50 },
      ],
      notes:
        "Two-storey house; proposed allocation recorded for estate planning.",
      x: 1060,
      y: 1800,
    },
  ];
}
