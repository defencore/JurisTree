/** Every amount, institution, identifier and personal description below is fictional. */
export function populateDemoRecords(project) {
  const p = (id) => project.people.find((p) => p.id === id);
  const name = (id, kind, fullName, from, to, reason) => ({
    id,
    kind,
    fullName,
    from,
    to,
    reason,
  });
  p("p2").nameHistory = [
    name(
      "demo-jane-maiden",
      "maiden",
      "Jane Roe",
      "1936",
      "1959",
      "Took John Doe's surname when they married.",
    ),
  ];
  p("p3").nameHistory = [
    name(
      "demo-jamie-maiden",
      "maiden",
      "Jamie Doe",
      "1962",
      "1995",
      "Took Jordan Roe's surname in 1995. Former partner Taylor Doe did not change surname.",
    ),
  ];
  p("p5").nameHistory = [
    name(
      "demo-jesse-birth",
      "birth",
      "Jesse Doe",
      "1988",
      "1995",
      "Born to Jamie Doe and Taylor Doe; later surname change recorded separately from parenthood.",
    ),
  ];
  p("p8").nameHistory = [
    name(
      "demo-casey-maiden",
      "maiden",
      "Casey Doe",
      "1991",
      "2017",
      "Took Robin Roe's surname after their marriage.",
    ),
  ];
  p("p9").notes +=
    " Kept the surname Roe during and after marriage to Taylor Doe.";
  p("p3").notes +=
    " Biological mother of Jesse; adoptive mother of Robin. Maiden surname Doe; current surname Roe after marrying Jordan.";
  p("p4").notes +=
    " Born Jordan Roe. Adoptive father of Robin and stepfather of Jesse; Jesse's biological father is Taylor Doe.";
  p("p5").notes +=
    " Jesse and Casey share biological father Taylor Doe and have different biological mothers.";
  p("p6").notes +=
    " Biological mother Quinn Roe; adopted by Jamie and Jordan Roe in 1996.";
  p("p5").biography =
    "Fictional museum researcher. Born Jesse Doe, later recorded as Jesse Roe. This demo shows family, education, finances and independently attributed information.";
  p("p5").educationRecords = [
    {
      id: "demo-education",
      institution: "Example University",
      qualification: "Master's degree",
      field: "History",
      from: "2006-09-01",
      to: "2011-06-30",
      graduatedAt: "2011-06-30",
      status: "completed",
      diplomaNumber: "DEMO-DIPLOMA-ONLY",
    },
  ];
  p("p5").occupations = [
    {
      id: "demo-work",
      kind: "work",
      organization: "Example Museum",
      role: "Research curator",
      from: "2012-09-01",
      appointment: "employed",
      income: "3200",
      currency: "USD",
      payPeriod: "monthly",
      notes: "Fictional workplace and income.",
    },
  ];
  p("p4").occupations = [
    {
      id: "demo-office",
      kind: "office",
      organization: "Example Town Council",
      role: "Council member",
      from: "2018-10-01",
      appointment: "elected",
      rank: "Demo office",
      income: "1500",
      currency: "USD",
      payPeriod: "monthly",
      reference: "DEMO-APPOINTMENT",
    },
  ];
  p("p5").identityDocuments = [
    {
      id: "demo-passport",
      kind: "passport",
      passportType: "ordinary",
      issuingCountry: "Exampleland (DEMO)",
      series: "DEMO",
      number: "DEMO-NOT-A-REAL-PASSPORT",
      issuedBy: "Fictional authority",
      issueDate: "2024-01-01",
      expiryDate: "2034-01-01",
      notes: "Fictional specimen; not an identity document.",
    },
  ];
  p("p5").immigrationRecords = [
    {
      id: "demo-permit",
      country: "Exampleland",
      status: "temporary",
      permitNumber: "DEMO-PERMIT-ONLY",
      from: "2024-01-01",
      to: "2027-01-01",
      notes: "Fictional permit example.",
    },
  ];
  p("p5").taxRecords = [
    {
      id: "demo-tax",
      country: "Exampleland",
      year: "2025",
      taxId: "DEMO-NOT-A-TIN",
      income: "38400",
      taxPaid: "4000",
      currency: "USD",
      notes: "Fictional amounts; not a filed tax return.",
    },
  ];
  p("p5").personalRecords = [
    {
      id: "demo-habit",
      category: "habits",
      title: "Reading",
      description: "Reads fictional stories in the evening.",
      basis: "self",
      reportedBy: "Fictional demo",
      recordedAt: "2026-01-01",
    },
  ];
  p("p5").events = [
    {
      id: "demo-family-gathering",
      category: "anniversary",
      title: "Annual fictional family gathering",
      date: "2020-10-20",
      repeat: "annual",
      notes: "A user-entered annual event.",
    },
    {
      id: "demo-jubilee",
      category: "jubilee",
      title: "Fictional museum jubilee",
      date: "2026-10-25",
      repeat: "none",
      notes: "An explicitly recorded jubilee.",
    },
  ];
  p("p4").legalRecords = [
    {
      id: "demo-property-case",
      kind: "propertyDivision",
      title: "Fictional property division with Riley Doe",
      date: "2022-10-12",
      caseNumber: "DEMO-CASE-001",
      authority: "Example District Court",
      role: "claimant",
      counterpartyId: "p11",
      status: "completed",
      outcome:
        "Fictional settlement describing the allocation of a jointly held property.",
      verification: "corroborated",
      basis: "source",
      sourceId: "d6",
    },
  ];
  p("p11").legalRecords = [
    {
      id: "demo-custody",
      kind: "imprisonment",
      title: "Fictional custody history requiring verification",
      from: "2016-01-15",
      to: "2018-01-15",
      authority: "Example authority",
      role: "convicted",
      status: "completed",
      verification: "pending",
      reportedBy: "Fictional witness",
      notes:
        "Invented and deliberately marked unverified; not a claim about a real person.",
      sourceId: "d9",
    },
  ];
  p("p5").financialRecords = [
    {
      id: "demo-gift",
      kind: "gift",
      title: "Fictional gift from Riley Doe",
      amount: "250",
      currency: "USD",
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
      title: "Fictional family loan",
      amount: "5000",
      currency: "USD",
      date: "2024-11-01",
      dueDate: "2026-11-01",
      direction: "borrowed",
      counterpartyId: "p4",
      interestRate: "0",
      status: "active",
      verification: "corroborated",
      reference: "DEMO-LOAN-ONLY",
    },
    {
      id: "demo-deposit",
      kind: "deposit",
      title: "Fictional term deposit",
      amount: "10000",
      currency: "USD",
      date: "2026-02-15",
      dueDate: "2027-02-15",
      direction: "held",
      institution: "Example Bank",
      interestRate: "3",
      status: "active",
      verification: "pending",
    },
    {
      id: "demo-investment",
      kind: "investment",
      title: "Fictional investment",
      amount: "2500",
      currency: "USD",
      date: "2025-04-01",
      direction: "held",
      institution: "Example Fund",
      status: "active",
      verification: "pending",
      notes: "No real account or investment product.",
    },
  ];
  p("p8").financialRecords = [
    {
      id: "demo-debt",
      kind: "debt",
      title: "Fictional obligation to Jesse Roe",
      amount: "500",
      currency: "USD",
      direction: "payable",
      counterpartyId: "p5",
      dueDate: "2026-12-01",
      status: "active",
      collateral: "No collateral in this fictional example.",
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
      title: "Fictional hormone treatment record",
      from: "2021-03-01",
      to: "2022-03-01",
      provider: "Example Clinic",
      basis: "self",
      verification: "pending",
      notes: "Invented self-reported history; no clinical inference.",
    },
    {
      id: "demo-surgery",
      kind: "surgery",
      title: "Fictional procedure record",
      date: "2023-05-10",
      provider: "Example Clinic",
      description: "Fictional example with unspecified clinical details.",
      basis: "self",
      verification: "pending",
    },
  ];
  p("p5").claims = [
    {
      id: "demo-rumor",
      kind: "rumor",
      title: "Fictional reported relationship",
      statement:
        "A fictional witness reported an earlier relationship with Avery Doe.",
      reportedBy: "Fictional witness",
      verification: "pending",
      basis: "hearsay",
      sourceId: "d9",
    },
  ];
  project.property = [
    {
      id: "demo-house",
      title: "Fictional family house",
      ownerId: "p4",
      value: 200000,
      currency: "USD",
      allocations: [
        { personId: "p5", percent: 50 },
        { personId: "p6", percent: 50 },
      ],
      notes: "Invented property and user-entered allocation plan.",
      x: 1060,
      y: 780,
    },
  ];
}
