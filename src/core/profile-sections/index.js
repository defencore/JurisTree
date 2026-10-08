import { appearanceSection } from "./appearance.js";
import { medicalSection } from "./medical.js";
import { skillsSection } from "./skills.js";
import { weaponsSection } from "./weapons.js";
import { travelSection } from "./travel.js";
import { legalSection } from "./legal.js";
import { financesSection } from "./finances.js";
import { identityHistorySection } from "./identity-history.js";
import { workSection } from "./work.js";
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
    appearance: appearanceSection(),
    medical: medicalSection(),
    skills: skillsSection(),
    weapons: weaponsSection(),
    travel: travelSection(),
    legal: legalSection(),
    finances: financesSection(),
    identityHistory: identityHistorySection(),
    occupations: workSection(),
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
