import { ageBounds, localDateString } from "./dates.js";
/** Unknown life status and uncertain birth years remain explicit; age markers use an 18-year threshold. */
export function personStatus(person, today = localDateString()) {
  const life =
    person.death || person.lifeStatus === "deceased"
      ? "deceased"
      : person.lifeStatus === "living"
        ? "living"
        : "unknown";
  const age = ageBounds(
    person.birth,
    life === "deceased" ? person.death : today,
  );
  return {
    life,
    age,
    minor: life !== "deceased" && !!age && age.max < 18,
    uncertainAge: life !== "deceased" && !!age && age.min < 18 && age.max >= 18,
  };
}
