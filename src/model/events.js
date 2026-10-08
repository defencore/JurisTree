import { recordConfigs } from "../core/config.js";
import { translate } from "../i18n/index.js";
import { sourceEvidence } from "../core/sources.js";

/** Collect dates from the project. Profile visibility is an optional view filter. */
export function collectProjectEvents(
  project,
  { sections = null, groupId = "" } = {},
) {
  const events = [],
    configs = recordConfigs(),
    included = (key) => !sections || sections.includes(key);
  const selected = new Set(
    project.people
      .filter((p) => !groupId || (p.groupIds || []).includes(groupId))
      .map((p) => p.id),
  );
  const relations = new Map(project.relations.map((r) => [r.id, r]));
  const sources = new Map();
  for (const d of project.documents) {
    if (d.purposes?.length && !d.purposes.includes(project.purpose)) continue;
    const children =
      d.type === "birth"
        ? (d.relations || [])
            .map((id) => relations.get(id))
            .filter((r) => r && ["parent", "adopted"].includes(r.type))
            .map((r) => r.to)
        : [];
    const subjects =
      d.subjectIds || (children.length ? children : d.people || []);
    for (const id of subjects) {
      const key = id + "|" + d.type,
        current = sources.get(key);
      if (
        !current ||
        (d.status === "available" &&
          sourceEvidence(d) === "official" &&
          !(
            current.status === "available" &&
            sourceEvidence(current) === "official"
          ))
      )
        sources.set(key, d);
    }
  }
  for (const p of project.people) {
    if (!selected.has(p.id)) continue;
    const sourceFor = (type) => sources.get(p.id + "|" + type)?.id || "";
    const add = (
      type,
      key,
      title,
      date,
      annual = false,
      sourceId = "",
      notes = "",
      recordId = "",
      section = "",
    ) => {
      if (date)
        events.push({
          id: p.id + ":" + type + ":" + key,
          personId: p.id,
          type,
          title,
          date: String(date),
          annual,
          sourceId,
          notes,
          recordId,
          section,
        });
    };
    if (p.birth)
      add(
        "birth",
        "birth",
        translate(
          p.death || p.lifeStatus === "deceased"
            ? "ui.birthDateMemorialDate"
            : "ui.birthday",
        ),
        p.birth,
        true,
        sourceFor("birth"),
      );
    if (p.death)
      add(
        "death",
        "death",
        translate("ui.deathAnniversary"),
        p.death,
        true,
        sourceFor("death"),
      );
    if (included("timeline"))
      for (const r of p.events || [])
        add(
          r.category || "custom",
          r.id,
          r.title || translate("ui.event"),
          r.date,
          r.repeat === "annual",
          r.sourceId,
          r.notes,
          r.id,
          "timeline",
        );
    for (const [section, key, type, label] of [
      ["residences", "residences", "residence", (r) => r.address],
      [
        "occupations",
        "occupations",
        "occupation",
        (r) => [r.organization, r.role].filter(Boolean).join(" · "),
      ],
      [
        "education",
        "educationRecords",
        "education",
        (r) => [r.institution, r.qualification].filter(Boolean).join(" · "),
      ],
    ])
      if (included(section))
        for (const r of p[key] || []) {
          add(
            type,
            r.id + "-from",
            translate("ui.started") + " " + label(r),
            r.from,
            false,
            r.sourceId,
            r.notes,
            r.id,
            section,
          );
          add(
            type,
            r.id + "-to",
            translate("ui.ended") + " " + label(r),
            r.to,
            false,
            r.sourceId,
            r.notes,
            r.id,
            section,
          );
          if (r.graduatedAt && r.graduatedAt !== r.to)
            add(
              type,
              r.id + "-graduation",
              translate("ui.graduationDate") + " · " + label(r),
              r.graduatedAt,
              false,
              r.sourceId,
              r.notes,
              r.id,
              section,
            );
        }
    if (included("pets"))
      for (const r of p.pets || []) {
        add(
          "pet",
          r.id + "-birth",
          translate("ui.petBirth") + " " + r.name,
          r.birth,
          !r.death,
          r.sourceId,
          r.notes,
          r.id,
          "pets",
        );
        add(
          "pet",
          r.id + "-death",
          translate("ui.memorialDate") + " " + r.name,
          r.death,
          true,
          r.sourceId,
          r.notes,
          r.id,
          "pets",
        );
      }
    for (const [section, cfg] of Object.entries(configs)) {
      if (!cfg.calendar || !included(section)) continue;
      for (const r of p[cfg.key] || []) {
        const seen = new Set();
        for (const [field, message] of cfg.calendar.dates) {
          if (!r[field] || seen.has(r[field])) continue;
          seen.add(r[field]);
          add(
            cfg.calendar.type,
            r.id + "-" + field,
            [
              message ? translate(message) : "",
              r.title || r.name || r.country || cfg.label,
            ]
              .filter(Boolean)
              .join(" · "),
            r[field],
            false,
            r.sourceId,
            r.notes,
            r.id,
            section,
          );
          events.at(-1).verification = r.verification;
        }
      }
    }
  }
  const peopleById = new Map(project.people.map((p) => [p.id, p]));
  for (const r of project.relations) {
    if (!selected.has(r.from) && !selected.has(r.to)) continue;
    if (!["spouse", "partner"].includes(r.type)) continue;
    const names = [r.from, r.to]
      .map((id) => peopleById.get(id)?.name)
      .filter(Boolean)
      .join(" & ");
    const annual =
      r.type === "spouse" &&
      !r.toDate &&
      !["ended", "divorced"].includes(r.status) &&
      !["unverified", "refuted"].includes(r.verification);
    for (const [key, date, label, repeats] of [
      [
        "start",
        r.fromDate,
        annual ? "ui.weddingAnniversary" : "ui.relationshipStarted",
        annual,
      ],
      ["end", r.toDate, "ui.endedRelationship", false],
    ]) {
      if (!date) continue;
      events.push({
        id: r.id + ":" + key,
        personId: r.from,
        relatedPersonIds: [r.to],
        relationId: r.id,
        type: "anniversary",
        title: translate(label) + " · " + names,
        date,
        annual: repeats,
        sourceId:
          project.documents.find((d) => (d.relations || []).includes(r.id))
            ?.id || "",
        notes: r.notes,
        verification: r.verification,
      });
    }
  }
  return events;
}
