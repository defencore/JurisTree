import { person } from "../model/lookup.js";
import { commit } from "../services/history.js";

export function toggleFavorite(id) {
  const p = person(id);
  if (p)
    commit(() => {
      p.favorite = !p.favorite;
    });
}
