import { identitySection } from "./identity.js";
import { immigrationSection } from "./immigration.js";
import { taxationSection } from "./taxation.js";
import { personalSection } from "./personal.js";
import { customSection } from "./custom.js";

export function extendedProfileSections() {
  return {
    identity: identitySection(),
    immigration: immigrationSection(),
    taxation: taxationSection(),
    personal: personalSection(),
    custom: customSection(),
  };
}
