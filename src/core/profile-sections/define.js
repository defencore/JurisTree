import { translate } from "../../i18n/index.js";

/** A section owns its fields, progressive disclosure groups and date rules. */
export function defineSection(
  key,
  title,
  symbol,
  recordLabel,
  groups,
  dateRanges = [],
  options = {},
) {
  const translated = groups.map(([label, fields]) => ({
    label: label ? translate(label) : "",
    fields: fields.map(([name, caption, type = "text", choices]) => [
      name,
      translate(caption),
      type,
      choices
        ? Object.fromEntries(
            Object.entries(
              type === "select" && !options.requiredChoices?.includes(name)
                ? { unspecified: "ui.notSpecified", ...choices }
                : choices,
            ).map(([value, message]) => [value, translate(message)]),
          )
        : undefined,
    ]),
  }));
  return {
    info: [translate(title), symbol],
    config: {
      key,
      label: translate(recordLabel),
      extended: true,
      groups: translated,
      fields: translated.flatMap((group) => group.fields),
      dateRanges,
      ...options,
    },
  };
}
