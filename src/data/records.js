export function personRecord([id, name, birth, death, gender], group) {
  return {
    id,
    name,
    birth,
    death,
    gender,
    x: 0,
    y: 0,
    lifeStatus: death ? "deceased" : "living",
    groupIds: [group],
    aliases: "",
    place: "Ontario, Canada",
    notes: "",
    requirements: null,
    avatarId: "",
    favorite: ["p4", "p5"].includes(id),
  };
}

export function sourceRecord(record) {
  return {
    assetId: "",
    filename: "",
    mime: "",
    size: 0,
    sourceUrl: "",
    accessedAt: "",
    language: "English",
    transcription: "",
    propertyIds: [],
    subjectIds: [],
    source: "Civil register extract",
    repository: "Brookfield County Archives",
    reference: "",
    notes: "",
    verification: "corroborated",
    purposes: [],
    x: 0,
    y: 0,
    ...record,
  };
}

export function formerName(
  person,
  surname,
  until,
  kind = "maiden",
  reason = "Surname changed on marriage.",
) {
  return {
    id: `name-${person.id}-${kind}`,
    kind,
    fullName: `${person.name.split(" ")[0]} ${surname}`,
    from: person.birth,
    to: until,
    reason,
  };
}
