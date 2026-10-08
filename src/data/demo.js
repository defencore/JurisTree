import { fresh } from "../model/project.js";
export function sample() {
  const s = fresh();
  s.title = "Doe family — fictional demo";
  s.purpose = "inheritance";
  s.demo = true;
  s.subjectId = "p1";
  s.claimantId = "p5";
  s.people = [
    ["p1", "John Doe", "1932", "2011", 55, 70, "m"],
    ["p2", "Jane Doe", "1936", "2018", 365, 70, "f"],
    ["p3", "Jamie Doe", "1962", "", 55, 300, "f"],
    ["p4", "Jordan Doe", "1960", "", 365, 300, "m"],
    ["p5", "Jesse Doe", "1988", "", 55, 530, "f"],
    ["p6", "Robin Doe", "1992", "", 365, 530, "m"],
    ["p7", "Taylor Roe", "1963", "", 690, 300, "m"],
    ["p8", "Casey Roe", "1991", "", 690, 530, "f"],
  ].map(([id, name, birth, death, x, y, gender]) => ({
    id,
    name,
    birth,
    death,
    x,
    y,
    gender,
    aliases: "",
    place: "",
    notes: "Fictional demonstration record. All relationships are invented.",
    requirements: null,
    avatarId: "",
  }));
  s.groups = [
    {
      id: "g1",
      name: "Doe family",
      color: "#54718a",
      notes: "Основна гілка родини",
      collapsed: false,
      x: null,
      y: null,
    },
    {
      id: "g2",
      name: "Roe family",
      color: "#688d79",
      notes: "Приклад іншої сімейної групи",
      collapsed: false,
      x: null,
      y: null,
    },
  ];
  s.people.forEach(
    (p) => (p.groupIds = [["p7", "p8"].includes(p.id) ? "g2" : "g1"]),
  );
  Object.assign(
    s.people.find((p) => p.id === "p5"),
    {
      birth: "1988-12-12",
    },
  );
  Object.assign(
    s.people.find((p) => p.id === "p6"),
    {
      birth: "1992-10-16",
    },
  );
  Object.assign(
    s.people.find((p) => p.id === "p8"),
    {
      birth: "1991-11-20",
    },
  );
  Object.assign(
    s.people.find((p) => p.id === "p1"),
    {
      death: "2011-11-03",
    },
  );
  s.relations = [
    ["r1", "p1", "p2", "spouse"],
    ["r2", "p1", "p3", "parent"],
    ["r3", "p2", "p3", "parent"],
    ["r4", "p3", "p4", "spouse"],
    ["r5", "p3", "p5", "parent"],
    ["r6", "p4", "p5", "parent"],
    ["r7", "p3", "p6", "parent"],
    ["r8", "p4", "p6", "parent"],
    ["r9", "p4", "p7", "acquaintance"],
    ["r10", "p7", "p8", "parent"],
    ["r11", "p6", "p8", "spouse"],
  ].map(([id, from, to, type]) => ({
    id,
    from,
    to,
    type,
    notes: "",
    disputed: false,
  }));
  const base = {
    assetId: "",
    filename: "",
    mime: "",
    size: 0,
    sourceUrl: "",
    accessedAt: "",
    language: "",
    transcription: "",
    propertyIds: [],
  };
  s.documents = [
    {
      ...base,
      id: "d1",
      subjectIds: ["p3"],
      title: "Birth record for Jamie Doe — DEMO",
      type: "birth",
      status: "needs_review",
      evidence: "official",
      people: ["p3", "p1", "p2"],
      relations: ["r2", "r3"],
      source: "Приклад архівного джерела",
      repository: "Умовний родинний архів",
      reference: "Книга 12, запис 48 — вигаданий приклад",
      date: "1962",
      notes:
        "Демонстраційний запис: перевірте імена батьків та дату народження.",
      x: 55,
      y: 780,
    },
    {
      ...base,
      id: "d2",
      title: "Jordan Doe and Taylor Roe — DEMO photograph",
      type: "photo",
      status: "available",
      evidence: "indirect",
      people: ["p4", "p7"],
      relations: ["r9"],
      source: "Сімейний фотоальбом — приклад",
      repository: "Родинна колекція",
      reference: "Альбом 2, сторінка 7 — вигаданий приклад",
      date: "",
      notes:
        "Приклад непрямого доказу знайомства. Файл у демонстраційному дереві не додано.",
      x: 705,
      y: 520,
    },
    {
      ...base,
      id: "d3",
      subjectIds: ["p5"],
      title: "Birth record for Jesse Doe — DEMO",
      type: "birth",
      status: "available",
      evidence: "official",
      people: ["p5", "p3", "p4"],
      relations: ["r5", "r6"],
      source: "Оригінал у родинному архіві — приклад",
      repository: "Родинний архів",
      reference: "Демонстраційний запис, не справжнє свідоцтво",
      date: "1988",
      notes: "Приклад наявного документа. Цифрову копію ще не прикріплено.",
      x: 360,
      y: 780,
    },
    {
      ...base,
      id: "d4",
      subjectIds: ["p1"],
      title: "Death record for John Doe — DEMO",
      type: "death",
      status: "requested",
      evidence: "official",
      people: ["p1"],
      relations: [],
      source: "Запит до установи — приклад",
      repository: "Умовний реєстр актів",
      reference: "Запит № 001 — вигаданий приклад",
      date: "",
      notes: "Приклад запитаного документа, якого ще немає.",
      x: 670,
      y: 780,
    },
  ];
  Object.assign(
    s.people.find((p) => p.id === "p5"),
    {
      identityDocuments: [
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
          sourceId: "",
        },
      ],
      personalRecords: [
        {
          id: "demo-habit",
          category: "habits",
          title: "Reading",
          description: "Reads fictional stories in the evening.",
          basis: "self",
          reportedBy: "Fictional demo",
          recordedAt: "2026-01-01",
          sourceId: "",
        },
      ],
    },
  );
  return s;
}
