export function populateBranchProfiles(project) {
  const profiles = [
    [
      "grace",
      "Primary school teacher",
      "Willowbank School",
      "Education",
      "2013",
      "Ottawa",
      "24 Cedar Avenue",
    ],
    [
      "lucy",
      "Architect",
      "Northline Design Studio",
      "Architecture",
      "2014",
      "Kingston",
      "8 Mill Lane",
    ],
    [
      "olivia",
      "Physiotherapist",
      "Lakeside Rehabilitation Centre",
      "Physiotherapy",
      "2016",
      "Toronto",
      "63 Orchard Road",
    ],
    [
      "emily",
      "Landscape planner",
      "Greenway Planning",
      "Environmental design",
      "2017",
      "Hamilton",
      "19 Linden Street",
    ],
    [
      "nathan",
      "Software engineer",
      "Harbour Systems",
      "Computer science",
      "2018",
      "Waterloo",
      "42 Maple Crescent",
    ],
  ];
  for (const [id, role, organization, field, from, city, address] of profiles) {
    const p = project.people.find((p) => p.id === id);
    p.biography = `${p.name} lives in ${city} and works as a ${role.toLowerCase()}. Maintains regular contact with relatives and attends the annual family gathering.`;
    p.occupations = [
      {
        id: `work-${id}`,
        kind: "work",
        organization,
        role,
        from,
        appointment: "employed",
        currency: "CAD",
        payPeriod: "monthly",
      },
    ];
    p.educationRecords = [
      {
        id: `education-${id}`,
        institution: "Riverside College",
        field,
        qualification: "Bachelor's degree",
        to: `${from}-06-30`,
        graduatedAt: `${from}-06-30`,
        status: "completed",
      },
    ];
    p.residences = [
      {
        id: `residence-${id}`,
        country: "Canada",
        city,
        address,
        from,
        kind: "home",
        status: "current",
        basis: "self",
        reportedBy: p.name,
        verification: "pending",
      },
    ];
  }
}
