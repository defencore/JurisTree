import { identitySection } from "./identity.js";
import { immigrationSection } from "./immigration.js";
import { taxationSection } from "./taxation.js";
import { personalSection } from "./personal.js";
import { customSection } from "./custom.js";
import { namesSection } from "./names.js";
import { educationSection } from "./education.js";
import { claimsSection } from "./claims.js";

export function extendedProfileSections() {
  return {
    names: namesSection(),
    education: educationSection(),
    claims: claimsSection(),
    identity: identitySection(),
    immigration: immigrationSection(),
    taxation: taxationSection(),
    personal: personalSection(),
    custom: customSection(),
  };
}
