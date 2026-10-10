import { getLanguage } from "./index.js";

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

/** Build immutable field definitions once per language, without freezing user data. */
export function localizedConfig(build) {
  const configurations = new Map();
  return () => {
    const language = getLanguage();
    if (!configurations.has(language))
      configurations.set(language, freeze(build()));
    return configurations.get(language);
  };
}
