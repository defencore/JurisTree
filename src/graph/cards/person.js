import { GRAPH_FONT, PERSON_CARD_WIDTH } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { theme } from "../../core/theme.js";
import { initials } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { displayDate } from "../../model/dates.js";
import { requirements } from "../../model/evidence.js";
import { objectUrl } from "../../services/files.js";
import { svgIcon } from "../../ui/icons.js";
import { personStatusBadges } from "../../ui/person-status.js";
import { graphTextWidth, svgPill, svgText, wrapMeasuredText } from "../text.js";

function roleBadge(role) {
  if (!role) return "";
  const width = Math.min(
    PERSON_CARD_WIDTH - 28,
    graphTextWidth(role.label, 12.5, 700) + 16,
  );
  const rows = wrapMeasuredText(role.label, width - 16, 2, 12.5, 700);
  const height = rows.length * 16.25 + 8;
  const y = 5 - height;
  return `<g class="person-card-role"><title>${esc(role.description || role.label)}</title><rect x="14" y="${y}" width="${width}" height="${height}" rx="4" fill="${role.bg}" stroke="${role.color}" stroke-width="0.8"/>${svgText(role.label, 22, y + 16.5, 100, 2, 12.5, role.color, 700, width - 16)}</g>`;
}

function statusRow(person) {
  let x = 16;
  return personStatusBadges(person)
    .map((badge) => {
      const label =
        badge.key === "unknown"
          ? translate("ui.statusUnknownShort")
          : badge.key === "uncertain-age"
            ? "18?"
            : badge.label;
      const width = graphTextWidth(label, 12, 700) + 34;
      const markup = `<g data-person-status="${badge.key}"><title>${esc(badge.label)}</title><rect x="${x}" y="58" width="${width}" height="23" rx="4" fill="${badge.bg}"/>${svgIcon(badge.icon, x + 6, 62, badge.color, 0.65)}${svgText(label, x + 26, 74, 40, 1, 12, badge.color, 700)}</g>`;
      x += width + 6;
      return markup;
    })
    .join("");
}
function dateRow(key, value, y, symbol) {
  const label = translate(key);
  return `<g class="person-card-date" data-date="${key}"><title>${esc(label + ": " + value)}</title>${svgIcon(symbol, 16, y - 14, theme.muted, 0.7)}${svgText(value, 40, y, 100, 1, 14, theme.muted, 400)}</g>`;
}
export function personCard(person, images, role) {
  const avatar =
    person.avatarId &&
    (images ? images[person.avatarId] : objectUrl(person.avatarId));
  const req = requirements(person);
  const badges = [
    [
      translate("ui.available3"),
      req.filter((r) => r.done).length,
      theme.teal,
      theme["green-soft"],
    ],
    [
      translate("ui.missing"),
      req.filter((r) => r.state === "missing").length,
      theme.amber,
      theme["amber-soft"],
    ],
    [
      translate("ui.review"),
      req.filter((r) => ["review", "requested"].includes(r.state)).length,
      theme.violet,
      theme["violet-soft"],
    ],
  ];
  let x = 0;
  const evidence = badges
    .map(([label, count, color, bg]) => {
      const pill = svgPill(`${label} ${count}`, x, 0, color, bg, 13, 6);
      x += pill.width + 4;
      return pill.svg;
    })
    .join("");
  const scale = Math.min(1, (PERSON_CARD_WIDTH - 32) / (x - 4));
  const death = person.death || person.lifeStatus === "deceased";
  return `<circle cx="42" cy="30" r="22" fill="${theme["blue-soft"]}"/>${avatar ? `<defs><clipPath id="c-${person.id}"><circle cx="42" cy="30" r="22"/></clipPath></defs><image href="${esc(avatar)}" x="20" y="8" width="44" height="44" preserveAspectRatio="xMidYMid slice" clip-path="url(#c-${person.id})"/>` : `<text x="42" y="36" text-anchor="middle" font-family="${GRAPH_FONT}" fill="${theme.muted}" font-size="17" font-weight="700">${esc(initials(person.name))}</text>`}
  ${svgText(person.name, 80, 23, 100, 2, 16, theme.ink, 700, PERSON_CARD_WIDTH - 100)}${statusRow(person)}
  ${dateRow("ui.birthDateLabel", displayDate(person.birth) || "?", 100, "cake")}
  ${death ? dateRow("ui.deathDateLabel", displayDate(person.death) || translate("ui.deathDateUnknown"), 122, "candle") : ""}
  <path d="M16 132H${PERSON_CARD_WIDTH - 16}" stroke="${theme.line}"/>
  ${svgText(translate("ui.documents"), 16, 152, 40, 1, 13, theme.muted, 400, PERSON_CARD_WIDTH - 116)}
  <g transform="translate(16 181) scale(${scale})">${evidence}</g>
  ${roleBadge(role)}
  ${person.id === state.project.subjectId ? `<g><title>${esc(translate("ui.ownerDeceasedEstateOwner"))}</title><circle cx="64" cy="48" r="8" fill="${theme["accent-soft"]}"/>${svgIcon("fingerprint", 58, 42, theme.accent, 0.5)}</g>` : ""}`;
}
export function personCardActions(person, dim) {
  const action = (kind, x, label, symbol, selected = false) =>
    `<g class="graph-${kind}" data-${kind}="${person.id}" transform="translate(${person.x + x} ${person.y + 137})" role="button" tabindex="0" aria-label="${esc(label)}" ${kind === "favorite" ? `aria-pressed="${selected}"` : ""} opacity="${dim ? 0.3 : 1}"><title>${esc(label)}</title><rect x="-8" y="-5" width="44" height="44" fill="transparent"/><rect width="28" height="24" rx="4" fill="${selected ? theme["accent-soft"] : theme["blue-soft"]}" stroke="${theme.line}"/>${svgIcon(symbol, 6, 4, selected ? theme.accent : theme.blue, 0.65)}</g>`;
  return (
    action(
      "favorite",
      PERSON_CARD_WIDTH - 82,
      translate(person.favorite ? "ui.removeFavorite" : "ui.addFavorite") +
        ": " +
        person.name,
      "star",
      !!person.favorite,
    ) +
    action(
      "biography",
      PERSON_CARD_WIDTH - 38,
      translate("ui.viewAutobiographyOf", { name: person.name }),
      "book",
    )
  );
}
