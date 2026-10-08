/** Fictional records illustrate optional details without inferring facts about real people. */
export function populateDemoDetails(project) {
  const person = (id) => project.people.find((p) => p.id === id);
  person("p5").appearanceRecords = [
    {
      id: "demo-appearance",
      title: "Fictional measurements",
      heightCm: "168",
      weightKg: "62.5",
      build: "Medium",
      eyeColor: "Green",
      hairColor: "Brown",
      glasses: "sometimes",
      from: "2026-01-01",
      marks: "Small fictional scar on the left hand.",
      basis: "self",
      reportedBy: "Jesse Roe",
      verification: "pending",
    },
  ];
  person("p5").medicalRecords = [
    {
      id: "demo-allergy",
      kind: "allergy",
      title: "Fictional peanut allergy",
      substance: "Peanuts",
      from: "2005",
      status: "active",
      foodAvoided: "Peanuts, according to this fictional self-report.",
      institution: "Example Clinic",
      recordNumber: "DEMO-NOT-A-MEDICAL-RECORD",
      date: "2026-01-10",
      nextReviewDate: "2026-10-22",
      basis: "self",
      reportedBy: "Jesse Roe",
      verification: "pending",
      notes: "Invented example; no medical recommendation is generated.",
    },
  ];
  person("p6").skillRecords = [
    {
      id: "demo-guitar",
      category: "hobby",
      name: "Guitar",
      level: "advanced",
      from: "2006",
      frequency: "Weekly",
      description: "Fictional acoustic guitar hobby.",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-judo",
      category: "martialArt",
      name: "Judo",
      level: "intermediate",
      from: "2015",
      qualification: "Fictional training certificate",
      issuer: "Example Sports Club",
      certificateNumber: "DEMO-TRAINING-ONLY",
      expiryDate: "2027-10-09",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-motorsport",
      category: "sport",
      name: "Motorsport",
      frequency: "Occasional",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-range",
      category: "weapons",
      name: "Sport target shooting",
      level: "beginner",
      from: "2025",
      basis: "self",
      verification: "pending",
    },
  ];
  person("p6").weaponRecords = [
    {
      id: "demo-airgun",
      kind: "airGun",
      title: "Fictional sporting air gun",
      model: "DEMO-MODEL",
      serialNumber: "DEMO-NOT-A-REAL-SERIAL",
      ownership: "owned",
      acquiredDate: "2025-02-01",
      permitNumber: "DEMO-REFERENCE-ONLY",
      permitExpiryDate: "2027-02-01",
      verification: "pending",
      basis: "self",
      notes:
        "Invented ownership and permit reference; no country-specific requirement is asserted.",
    },
  ];
  person("p5").travelRecords = [
    {
      id: "demo-journey",
      title: "Fictional trip to Sample Republic",
      fromCountry: "Exampleland",
      toCountry: "Sample Republic",
      departureDate: "2026-10-11",
      entryDate: "2026-10-11",
      exitDate: "2026-10-20",
      returnDate: "2026-10-21",
      purpose: "tourism",
      status: "planned",
      fromCity: "Example City",
      toCity: "Sample City",
      transport: "Fictional rail journey",
      passportReference: "DEMO-NOT-A-REAL-PASSPORT",
      verification: "pending",
      basis: "self",
    },
  ];
  person("p10").immigrationRecords = [
    {
      id: "demo-former-citizenship",
      country: "Exampleland",
      status: "formerCitizen",
      from: "1987-02-28",
      to: "2018-03-01",
      change: "renounced",
      changeDate: "2018-03-01",
      notes: "Fictional citizenship history.",
    },
    {
      id: "demo-new-citizenship",
      country: "Sample Republic",
      status: "citizen",
      from: "2018-03-01",
      change: "acquired",
      changeDate: "2018-03-01",
      previousCountry: "Exampleland",
      citizenshipBasis: "Fictional naturalization",
      notes: "Invented country and status.",
    },
  ];
  person("p5").financialRecords.push({
    id: "demo-spending",
    kind: "expense",
    title: "Fictional household spending",
    category: "Groceries",
    amount: "600",
    currency: "USD",
    from: "2026-01-01",
    direction: "given",
    frequency: "monthly",
    verification: "pending",
    basis: "self",
    notes:
      "A manually recorded estimate; not an automatically calculated balance.",
  });
  person("p5").personalRecords.push(
    {
      id: "demo-food-tastes",
      category: "food",
      title: "Fictional food preferences",
      description: "Likes vegetable dishes and mildly spicy food.",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-charity",
      category: "charity",
      title: "Fictional volunteering",
      description: "Teaches local history at an example community group.",
      frequency: "Weekly",
      basis: "self",
      verification: "pending",
    },
  );
  person("p10").personalRecords = [
    {
      id: "demo-attraction",
      category: "attraction",
      title: "Fictional self-described preferences",
      description: "Values kindness and shared interests.",
      basis: "self",
      verification: "pending",
    },
  ];
  person("p11").legalRecords.push({
    id: "demo-investigation",
    kind: "investigation",
    title: "Fictional report about a suspected financial offense",
    country: "Exampleland",
    role: "suspect",
    status: "pending",
    date: "2026-09-15",
    legalProvision: "DEMO-PROVISION-ONLY",
    verification: "pending",
    reportedBy: "Fictional witness",
    sourceId: "d9",
    notes: "An invented attributed allegation, not a finding of guilt.",
  });
  Object.assign(
    project.relations.find((r) => r.id === "r9"),
    {
      quality: "good",
      context: "professional",
      contextNotes: "Fictional professional friendship.",
    },
  );
  Object.assign(
    project.relations.find((r) => r.id === "r17"),
    {
      quality: "hostile",
      context: "business",
      contextNotes:
        "Fictional strained relationship following a property dispute.",
    },
  );
}
