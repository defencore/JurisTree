import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import {
  profileRecordTarget,
  recordSourceType,
} from "../model/source-record-links.js";
import { editDocument } from "./documents.js";

export async function editRecordAttachments(target) {
  const found = profileRecordTarget(state.project, target);
  if (!found) return;
  const { profile, record, config } = found;
  await editDocument(record.sourceId || null, [], {
    personId: profile.id,
    recordTarget: target,
    type: recordSourceType(target.section, record),
    title: `${record.awardName || record.title || record.name || config.label} · ${profile.name}`,
    date: record.awardDate || record.date || "",
  });
  const root = $("[data-profile-browser]");
  root?.profileJump?.(target.section, false);
}
