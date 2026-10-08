import { dateExact, localDateString, partialDate } from "./dates.js";

function completedYears(birth, at) {
  const year = Number(at.slice(0, 4)),
    start = Number(birth.slice(0, 4));
  let birthday = birth.slice(5);
  if (birthday === "02-29" && !dateExact(year + "-02-29")) birthday = "02-28";
  return year - start - (at.slice(5) < birthday ? 1 : 0);
}
/** Unknown life status and uncertain birth years remain explicit; age markers use an 18-year threshold. */
export function personStatus(person, today = localDateString()) {
  const life =
    person.death || person.lifeStatus === "deceased"
      ? "deceased"
      : person.lifeStatus === "living"
        ? "living"
        : "unknown";
  const birth = partialDate(person.birth),
    at = life === "deceased" ? dateExact(person.death) : dateExact(today);
  let age = null;
  if (birth && at && birth.max <= at)
    age = {
      min: completedYears(birth.max, at),
      max: completedYears(birth.min, at),
    };
  return {
    life,
    age,
    minor: life !== "deceased" && !!age && age.max < 18,
    uncertainAge: life !== "deceased" && !!age && age.min < 18 && age.max >= 18,
  };
}
