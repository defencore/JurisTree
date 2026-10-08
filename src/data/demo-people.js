import { personRecord, formerName } from "./records.js";

export function demoPeople() {
  const rows = [
    ["p1", "John Doe", "1932-03-04", "2011-11-03", "m", "g1"],
    ["p2", "Jane Doe", "1936-07-18", "2018-02-14", "f", "g1"],
    ["p3", "Jamie Roe", "1962-06-09", "", "f", "g1"],
    ["p4", "Jordan Roe", "1960-05-21", "", "m", "g1"],
    ["p5", "Jesse Ward", "1988-12-12", "", "f", "g1"],
    ["p6", "Robin Roe", "1992-10-16", "", "m", "g1"],
    ["p7", "Taylor Ward", "1963-04-07", "", "m", "g2"],
    ["p8", "Casey Roe", "1991-11-20", "", "f", "g2"],
    ["p9", "Morgan Blake", "1964-09-12", "", "f", "g2"],
    ["p10", "Avery Hale", "1987-02-28", "", "x", "g2"],
    ["p11", "Riley Cross", "1975-08-10", "", "m", "g2"],
    ["p13", "Drew Roe", "2018-05-14", "", "x", "g1"],
    ["p12", "Quinn Vale", "1970-01-25", "", "f", "g2"],
  ].map((row) => personRecord(row, row[5]));
  const names = [
    [
      "p2",
      "Hart",
      "1959-06-15",
      "maiden",
      "Took John Doe's surname on marriage.",
    ],
    [
      "p3",
      "Doe",
      "1995-08-19",
      "maiden",
      "Took Jordan Roe's surname on marriage; Jesse retained the birth surname Ward.",
    ],
    [
      "p6",
      "Vale",
      "1996-02-12",
      "birth",
      "Surname changed from Vale to Roe on adoption by Jamie and Jordan Roe.",
    ],
    [
      "p8",
      "Ward",
      "2017-07-08",
      "maiden",
      "Took Robin Roe's surname on marriage.",
    ],
  ];
  for (const [id, surname, until, kind, reason] of names) {
    const person = rows.find((p) => p.id === id);
    person.nameHistory = [formerName(person, surname, until, kind, reason)];
  }
  return rows;
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
    ["r19", "p6", "p13", "parent"],
    ["r20", "p8", "p13", "parent"],
    ["r18", "p4", "p5", "step_parent"],
  ].map(([id, from, to, type]) => ({
    id,
    from,
    to,
    type,
    notes: "",
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
    reportedBy: "Martin Keene",
    notes: "Reported by Martin Keene; neither partner has confirmed the dates.",
  });
  for (const id of ["r7", "r8"])
    set(id, {
      fromDate: "1996-02-12",
      verification: "confirmed",
      notes:
        "Adoption of Robin Roe by Jamie and Jordan Roe. Quinn Vale is the recorded biological mother.",
    });
  return rows;
}
