export function demoPeople() {
  return [
    ["p1", "John Doe", "1932-03-04", "2011-11-03", 55, 70, "m", "g1"],
    ["p2", "Jane Doe", "1936-07-18", "2018-02-14", 365, 70, "f", "g1"],
    ["p3", "Jamie Roe", "1962-06-09", "", 55, 300, "f", "g1"],
    ["p4", "Jordan Roe", "1960-05-21", "", 365, 300, "m", "g1"],
    ["p5", "Jesse Roe", "1988-12-12", "", 55, 530, "f", "g1"],
    ["p6", "Robin Roe", "1992-10-16", "", 365, 530, "m", "g1"],
    ["p7", "Taylor Doe", "1963-04-07", "", 690, 300, "m", "g2"],
    ["p8", "Casey Roe", "1991-11-20", "", 690, 530, "f", "g2"],
    ["p9", "Morgan Roe", "1964-09-12", "", 1010, 300, "f", "g2"],
    ["p10", "Avery Doe", "1987-02-28", "", 1010, 530, "x", "g2"],
    ["p11", "Riley Doe", "1975-08-10", "", 1330, 300, "m", "g2"],
    ["p12", "Quinn Roe", "1970-01-25", "", 1330, 70, "f", "g2"],
  ].map(([id, name, birth, death, x, y, gender, group]) => ({
    id,
    name,
    birth,
    death,
    x,
    y,
    gender,
    lifeStatus: death ? "deceased" : "living",
    groupIds: [group],
    aliases: "",
    place: "Exampleland (DEMO)",
    notes: "Fictional demonstration record. All relationships are invented.",
    requirements: null,
    avatarId: "",
    favorite: ["p4", "p5"].includes(id),
  }));
}
export function demoRelations() {
  const rows = [
    ["r1", "p1", "p2", "spouse"],
    ["r2", "p1", "p3", "parent"],
    ["r3", "p2", "p3", "parent"],
    ["r4", "p3", "p4", "spouse"],
    ["r5", "p3", "p5", "parent"],
    ["r6", "p7", "p5", "parent"],
    ["r7", "p3", "p6", "adopted"],
    ["r8", "p4", "p6", "adopted"],
    ["r9", "p4", "p7", "acquaintance"],
    ["r10", "p7", "p8", "parent"],
    ["r11", "p6", "p8", "spouse"],
    ["r12", "p9", "p8", "parent"],
    ["r13", "p7", "p9", "spouse"],
    ["r14", "p3", "p7", "partner"],
    ["r15", "p12", "p6", "parent"],
    ["r16", "p5", "p10", "partner"],
    ["r17", "p4", "p11", "acquaintance"],
    ["r18", "p4", "p5", "step_parent"],
  ].map(([id, from, to, type]) => ({
    id,
    from,
    to,
    type,
    notes: "Fictional demonstration relationship.",
    disputed: false,
  }));
  const set = (id, details) =>
    Object.assign(
      rows.find((r) => r.id === id),
      details,
    );
  set("r1", {
    unionKind: "marriage",
    fromDate: "1959-06-15",
    status: "widowed",
    verification: "confirmed",
  });
  set("r4", {
    unionKind: "marriage",
    fromDate: "1995-08-19",
    status: "current",
    verification: "confirmed",
  });
  set("r11", {
    unionKind: "marriage",
    fromDate: "2017-07-08",
    status: "current",
    verification: "confirmed",
  });
  set("r13", {
    unionKind: "marriage",
    fromDate: "1990-03-17",
    toDate: "2000-05-10",
    status: "divorced",
    verification: "confirmed",
  });
  set("r14", {
    unionKind: "unregistered",
    fromDate: "1985-06-01",
    toDate: "1989-09-01",
    status: "ended",
    duration: "longTerm",
    verification: "confirmed",
  });
  set("r16", {
    unionKind: "dating",
    fromDate: "2019-04-01",
    toDate: "2021-02-01",
    status: "ended",
    duration: "temporary",
    verification: "unverified",
    reportedBy: "Fictional witness",
    notes:
      "Unverified example; the partners' identities and orientations are recorded independently.",
  });
  for (const id of ["r7", "r8"])
    set(id, {
      fromDate: "1996-02-12",
      verification: "confirmed",
      notes:
        "Adoption of Robin Roe by Jamie and Jordan Roe. Quinn Roe is the recorded biological mother.",
    });
  return rows;
}
