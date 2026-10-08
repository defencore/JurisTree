import { esc } from "../core/dom.js";
import { theme } from "../core/theme.js";
import { translate } from "../i18n/index.js";
import { personStatus } from "../model/person-status.js";
import { icon } from "./icons.js";

export function personStatusBadges(person, today) {
  const status = personStatus(person, today);
  const info = {
    living: {
      label: translate("ui.living"),
      icon: "heartPulse",
      color: theme.teal,
      bg: theme["green-soft"],
    },
    deceased: {
      label: translate("ui.deceased"),
      icon: "candle",
      color: theme.muted,
      bg: theme["blue-soft"],
    },
    unknown: {
      label: translate("ui.lifeStatusUnknown"),
      icon: "help",
      color: theme.muted,
      bg: theme["blue-soft"],
    },
  };
  return [
    { key: status.life, ...info[status.life] },
    ...(status.minor
      ? [
          {
            key: "minor",
            label: translate("ui.under18"),
            icon: "user",
            color: theme.accent,
            bg: theme["amber-soft"],
          },
        ]
      : []),
    ...(status.uncertainAge
      ? [
          {
            key: "uncertain-age",
            label: translate("ui.ageNeedsClarification"),
            icon: "help",
            color: theme.accent,
            bg: theme["amber-soft"],
          },
        ]
      : []),
  ];
}
export function personStatusMarkup(person) {
  return `<span class="person-status">${personStatusBadges(person)
    .map(
      (b) =>
        `<span class="person-status-badge" data-person-status="${b.key}">${icon(b.icon)}${esc(b.label)}</span>`,
    )
    .join("")}</span>`;
}
