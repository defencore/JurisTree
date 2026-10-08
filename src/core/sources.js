import { defineSection } from "./profile-sections/define.js";

/** Source review and the truth of an individual claim are recorded separately. */
export function sourceVerificationConfig() {
  return defineSection(
    "",
    "ui.verificationDetails",
    "search",
    "ui.verificationDetails",
    [
      [
        "ui.verificationDetails",
        [
          [
            "verification",
            "ui.verificationStatus",
            "select",
            {
              unspecified: "ui.notSpecified",
              pending: "ui.pendingVerification",
              corroborated: "ui.corroborated",
              refuted: "ui.refuted",
              inconclusive: "ui.inconclusive",
            },
          ],
          ["checkedBy", "ui.checkedBy"],
          ["checkedAt", "ui.checkedOn", "date"],
          ["verificationNotes", "ui.verificationNotes", "textarea"],
        ],
      ],
    ],
  ).config;
}

export function sourceEvidence(d) {
  if (
    d.type === "rumor" ||
    ["pending", "refuted", "inconclusive"].includes(d.verification)
  )
    return "unverified";
  if (["photo", "letter", "testimony", "recording"].includes(d.type))
    return "indirect";
  return d.evidence;
}

export function sourceNeedsReview(d) {
  return (
    d.status === "needs_review" ||
    ["pending", "refuted", "inconclusive"].includes(d.verification) ||
    (d.status === "available" && sourceEvidence(d) === "unverified")
  );
}
