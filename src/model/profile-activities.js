/** Consolidate former activity summaries once when reading a saved project. */
export function migrateProfileActivities(profile) {
  const { hobbies, interests, ...result } = profile;
  if (profile.skillRecords != null && !Array.isArray(profile.skillRecords))
    return result;
  const records = [...(profile.skillRecords || [])];
  const ids = new Set(records.map((record) => record?.id));
  for (const [category, value] of [
    ["hobby", hobbies],
    ["interest", interests],
  ]) {
    const text = String(value ?? "").slice(0, 5000);
    if (!text.trim()) continue;
    const base = `overview-${category}-${profile.id.slice(0, 70)}`;
    let id = base;
    for (let suffix = 1; ids.has(id); suffix++) id = `${base}-${suffix}`;
    ids.add(id);
    records.push({
      id,
      category,
      ...(text.length <= 1000 && !/[\r\n]/.test(text)
        ? { name: text }
        : { description: text }),
    });
  }
  result.skillRecords = records;
  return result;
}

/** Translate obsolete visibility keys at the archive/draft boundary. */
export function migrateProfileSectionKeys(keys) {
  const renamed = { interests: "skills", health: "medical" };
  return [
    ...new Set(
      keys.map((key) => (Object.hasOwn(renamed, key) ? renamed[key] : key)),
    ),
  ];
}
