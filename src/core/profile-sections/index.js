import { pregnancySection } from "./pregnancy.js";
import { deathSection } from "./death.js";
import { militarySection } from "./military.js";
import { witnessesSection } from "./witnesses.js";
import { contactsSection } from "./contacts.js";
import { residencesSection } from "./residences.js";
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
import { assetsSection } from "./assets.js";
import { encumbrancesSection } from "./encumbrances.js";
import { accountsSection } from "./accounts.js";
import { cryptoSection } from "./crypto.js";
import { companiesSection } from "./companies.js";
import { sanctionsSection } from "./sanctions.js";
import { politicalSection } from "./political.js";

export function extendedProfileSections() {
  return {
    pregnancy: pregnancySection(),
    death: deathSection(),
    military: militarySection(),
    witnesses: witnessesSection(),
    contacts: contactsSection(),

    residences: residencesSection(),
    appearance: appearanceSection(),
    medical: medicalSection(),
    skills: skillsSection(),
    weapons: weaponsSection(),
    travel: travelSection(),
    legal: legalSection(),
    finances: financesSection(),
    assets: assetsSection(),
    encumbrances: encumbrancesSection(),
    accounts: accountsSection(),
    crypto: cryptoSection(),
    companies: companiesSection(),
    sanctions: sanctionsSection(),
    political: politicalSection(),
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
