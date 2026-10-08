/** Fictional records illustrate optional details without inferring facts about real people. */
export function populateDemoDetails(project) {
  const person = (id) => project.people.find((p) => p.id === id);
  person("p6").residences = [
    {
      id: "demo-residence-abroad",
      country: "United Kingdom",
      city: "Cambridge",
      address: "12 Willow Lane",
      from: "2012-09-01",
      to: "2014-06-30",
      kind: "study",
      status: "former",
      basis: "self",
      reportedBy: "Robin Roe",
      verification: "pending",
      notes: "Student accommodation during the college programme.",
    },
    {
      id: "demo-residence-home",
      country: "Canada",
      city: "Ottawa",
      from: "2014-07-01",
      kind: "home",
      status: "current",
      basis: "self",
      reportedBy: "Robin Roe",
      verification: "pending",
    },
  ];
  person("p5").appearanceRecords = [
    {
      id: "demo-appearance",
      title: "Physical description",
      heightCm: "168",
      weightKg: "62.5",
      build: "Medium",
      eyeColor: "Green",
      hairColor: "Brown",
      glasses: "sometimes",
      from: "2026-01-01",
      marks: "Small scar on the left hand.",
      basis: "self",
      reportedBy: "Jesse Ward",
      verification: "pending",
    },
  ];
  person("p5").medicalRecords = [
    {
      id: "demo-allergy",
      kind: "allergy",
      title: "Peanut allergy",
      substance: "Peanuts",
      from: "2005",
      status: "active",
      foodAvoided: "Peanuts; checks ingredient labels before eating.",
      institution: "Northbridge Health Centre",
      recordNumber: "MR-260110-84",
      date: "2026-01-10",
      nextReviewDate: "2026-10-22",
      basis: "self",
      reportedBy: "Jesse Ward",
      verification: "pending",
      notes: "Self-reported allergy; supporting clinic record requested.",
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
      description: "Plays acoustic guitar with a local music group.",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-judo",
      category: "martialArt",
      name: "Judo",
      level: "intermediate",
      from: "2015",
      qualification: "Club training certificate",
      issuer: "Riverside Sports Club",
      certificateNumber: "JD-2019-042",
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
      title: "Sporting air gun",
      model: "Aster AR-12",
      serialNumber: "AG28471",
      ownership: "owned",
      acquiredDate: "2025-02-01",
      permitNumber: "SP-20481",
      permitExpiryDate: "2027-02-01",
      verification: "pending",
      basis: "self",
      notes: "Kept in a locked cabinet; permit copy requested.",
    },
  ];
  person("p5").travelRecords = [
    {
      id: "demo-journey",
      title: "Autumn trip to Portugal",
      fromCountry: "Canada",
      toCountry: "Portugal",
      departureDate: "2026-10-11",
      entryDate: "2026-10-11",
      exitDate: "2026-10-20",
      returnDate: "2026-10-21",
      purpose: "tourism",
      status: "planned",
      fromCity: "Ottawa",
      toCity: "Lisbon",
      transport: "Flight via Toronto",
      passportReference: "PA7314062",
      verification: "pending",
      basis: "self",
    },
  ];
  person("p10").immigrationRecords = [
    {
      id: "demo-former-citizenship",
      country: "Canada",
      status: "formerCitizen",
      from: "1987-02-28",
      to: "2018-03-01",
      change: "renounced",
      changeDate: "2018-03-01",
      notes: "Citizenship renunciation recorded after naturalisation abroad.",
    },
    {
      id: "demo-new-citizenship",
      country: "United Kingdom",
      status: "citizen",
      from: "2018-03-01",
      change: "acquired",
      changeDate: "2018-03-01",
      previousCountry: "Canada",
      citizenshipBasis: "Naturalisation after residence",
      notes:
        "Citizenship certificate date recorded from the personal statement.",
    },
  ];
  person("p5").financialRecords.push({
    id: "demo-spending",
    kind: "expense",
    title: "Household spending",
    category: "Groceries",
    amount: "600",
    currency: "CAD",
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
      title: "Food preferences",
      description: "Likes vegetable dishes and mildly spicy food.",
      basis: "self",
      verification: "pending",
    },
    {
      id: "demo-charity",
      category: "charity",
      title: "Community volunteering",
      description: "Teaches local history at Willowbank Community Centre.",
      frequency: "Weekly",
      basis: "self",
      verification: "pending",
    },
  );
  person("p10").personalRecords = [
    {
      id: "demo-attraction",
      category: "attraction",
      title: "Self-described preferences",
      description: "Values kindness and shared interests.",
      basis: "self",
      verification: "pending",
    },
  ];
  person("p11").legalRecords.push({
    id: "demo-investigation",
    kind: "investigation",
    title: "Report about a suspected financial offense",
    country: "Canada",
    role: "suspect",
    status: "pending",
    date: "2026-09-15",
    legalProvision: "Case referral FC-2026-0915",
    verification: "pending",
    reportedBy: "Martin Keene",
    sourceId: "d9",
    notes:
      "Statement attributed to Martin Keene; no court finding or independent confirmation is recorded.",
  });
  Object.assign(
    project.relations.find((r) => r.id === "r9"),
    {
      quality: "good",
      context: "professional",
      contextNotes:
        "Regular professional contact through local council projects.",
    },
  );
  Object.assign(
    project.relations.find((r) => r.id === "r17"),
    {
      quality: "hostile",
      context: "business",
      contextNotes: "Strained relationship following a property dispute.",
    },
  );
}
