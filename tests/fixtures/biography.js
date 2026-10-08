import { sample } from "../../src/data/demo.js";

export function biographyProject() {
  const project = sample();
  const p = project.people.find((person) => person.id === "p5");
  Object.assign(p, {
    name: "Alex Example",
    aliases: "Alex Morgan",
    lifeStatus: "living",
    place: "Kyiv, Ukraine",
    biography: "My life story.\nLiteral <b>text</b>, without HTML formatting.",
    bioSourceIds: ["bio-source"],
    health: "Recorded health details",
    healthSourceIds: ["health-source"],
    hobbies: "Watercolor painting",
    interests: "Local history",
    notes: "Research note for the complete profile",
    requirements: ["birth", "archive"],
    events: [
      {
        id: "profile-event",
        title: "Graduation",
        date: "2010-06-20",
        repeat: "annual",
        notes: "Graduated with honors",
        sourceId: "bio-source",
      },
    ],
    contacts: [
      {
        id: "profile-contact",
        type: "email",
        label: "Personal email",
        value: "alex@example.org",
        notes: "Preferred contact",
      },
    ],
    residences: [
      {
        id: "profile-address",
        address: "10 Example Street",
        from: "2001",
        to: "2010",
        notes: "Childhood home",
        sourceId: "bio-source",
      },
    ],
    occupations: [
      {
        id: "profile-work",
        organization: "Example University",
        role: "Architecture",
        kind: "education",
        from: "2005",
        to: "2010",
        location: "Kyiv",
        notes: "Master's degree",
        sourceId: "bio-source",
      },
    ],
    pets: [
      {
        id: "profile-pet",
        name: "Sunny",
        type: "dog",
        birth: "2020-04-03",
        death: "",
        notes: "Adopted from a shelter",
        sourceId: "bio-source",
      },
    ],
  });
  project.relations.find((r) => r.id === "r5").notes =
    "Recorded family relationship";
  project.property = [
    {
      id: "profile-property",
      title: "Family studio",
      ownerId: "p5",
      value: 0,
      currency: "USD",
      notes: "Property note",
      allocations: [
        { personId: "p5", percent: 75 },
        { personId: "p6", percent: 25 },
      ],
      x: 900,
      y: 20,
    },
    {
      id: "shared-property",
      title: "Family book collection",
      ownerId: "p1",
      value: "",
      currency: "USD",
      notes: "Shared collection",
      allocations: [{ personId: "p5", percent: 30 }],
      x: 900,
      y: 220,
    },
  ];
  for (const [id, title, bindings] of [
    ["bio-source", "Life story source", {}],
    ["health-source", "Health record source", {}],
    ["relationship-source", "Relationship-only source", { relations: ["r5"] }],
    [
      "property-source",
      "Property-only source",
      { propertyIds: ["profile-property"] },
    ],
    ["unrelated-source", "Unrelated source", {}],
  ])
    project.documents.push({
      ...project.documents[0],
      id,
      title,
      people: [],
      subjectIds: [],
      relations: [],
      propertyIds: [],
      purposes: ["family"],
      source: "Example archive",
      notes: "Source note",
      transcription: "Recorded source text",
      ...bindings,
    });
  return project;
}
