import { state } from "../core/state.js";
import { download, safeName } from "../core/utils.js";
import {
  evidenceRegisterCsv,
  evidenceRegisterSelection,
} from "../model/evidence-register.js";
import { localDateString } from "../model/dates.js";

export function exportEvidenceRegister() {
  const { docs } = evidenceRegisterSelection(state.project, state);
  download(
    new Blob([evidenceRegisterCsv(docs)], { type: "text/csv;charset=utf-8" }),
    `${safeName(state.project.title)}-evidence-${localDateString()}.csv`,
  );
}
