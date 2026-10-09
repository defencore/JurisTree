# User guide

JurisTree is a multilingual workspace for family relationships, personal profiles, documents, evidence, events and property history. It runs entirely in the browser and can be hosted on GitHub Pages.

Start with the [first-map tutorial](getting-started.md) to create people, family links, groups and supporting records. The same walkthrough is available in all interface languages through the book button beside the language selector, with a downloadable eight-person example.

The application uses native JavaScript ES modules and plain CSS. It has no backend, user accounts, remote database, production Node.js runtime or CDN dependency. JSZip and SVG icons are included locally.

## Features

- Eight workspace modes and an optional blank project template.
- People, family groups and family or professional relationship types, including biological parenthood, adoption, step-parenthood and acquaintance.
- Optional relationships during person creation, including both parents, with explicit roles, periods and verification. Person and links save and undo together. New cards appear near the current view or relatives and are centered at a readable scale.
- Ordered two-person selection with Ctrl / ⌘ or Shift + click, including the sidebar list, prefills the relationship editor. A normal click followed by a modified click also selects a pair.
- Interactive SVG map with dragging, zoom, multiple selection, filters and generation, circle or network layouts. Person cards show full birth/death dates on separate rows, icon-and-text life/age badges and selection-relative family roles.
- Touch navigation with one-finger panning, two-finger zoom, readable person focus and an explicit card movement mode. Selecting a person from the list centers their card at a readable scale on desktop and mobile. Mobile controls are collapsible and the person panel opens as a bottom sheet.
- Collapsible map options on tablets; adding a person closes overlapping phone/tablet panels to expose their card.
- Shortest and alternative paths, neighborhoods, common connections and connecting networks.
- Kinship descriptions based on recorded relationships, including half-siblings when both biological parent sets are recorded.
- Favorite people in a sidebar list and a quick-access strip; selecting a favorite centers their card at a readable scale across map filters.
- Draggable dialogs and profile windows, with viewport bounds, touch support, keyboard movement and a reset-position control.
- Document references, digital attachments, evidence states and configurable checklists.
- Profiles with contacts, residence history, biographies, work, education, interests, health information and pets.
- Optional identity documents, citizenship and immigration records, tax declarations, habits and beliefs, and custom facts. Each section supports multiple records, dates, notes and linked sources.
- Optional identified assets, property restrictions, financial accounts, cryptoassets, company interests, sanctions records and political party affiliation.
- Formal and informal professional connections, with directed reporting lines, organization, roles, periods and verification.
- Optional pregnancy outcomes, death circumstances, military service and awards, linked witnesses and dated contact or social profiles.
- Biography review with configurable periods, minimum gap lengths, corroborated-only coverage and records awaiting verification.
- A complete autobiography view for every person, available from the map, people list and profile panel. It includes populated profile sections regardless of workspace visibility, family and professional relationships, property, notes and linked sources with attachments.
- Month and year calendar views with direct year navigation, birthdays, wedding anniversaries, jubilees, memorial dates, travel, medical reviews, status changes and other dated records.
- Advanced people filters with AND/OR conditions, quick selections, live result statistics, sorting, saved project queries and CSV exports.
- Global search across all stored values and linked context, with combined queries, field filters, keyboard navigation and multilingual terms.
- A4 autobiography printing and browser Save as PDF, including every populated section and source reference.
- Upcoming anniversaries and a historical timeline, including partial dates and leap-day handling.
- Property history with dated ownership/use, gifts, sales, inheritance, evidence review and competing claims; proposed allocation shares remain separate.
- Undo/redo, browser draft storage, portable ZIP archives and PNG/SVG image export.
- English, Ukrainian and Russian interfaces, displayed as **EN / UA / RU**.

The demo contains 99 people, 163 relationships, 102 source references and 10 family groups, spanning eight generations from 1824 to 2025. All identities, relationships, institutions, identifiers and personal details are invented. The project title carries the fictional-data notice; individual records use natural names and descriptions.

Surname histories match the recorded events: Jane Hart became Jane Doe, Jamie Doe became Jamie Roe, Robin Vale became Robin Roe on adoption, and Casey Ward became Casey Roe on marriage. Jesse Ward retains her biological father's surname. Morgan Blake retains her birth surname throughout her marriage and divorce. Biological, adoptive and step-parent relationships remain separate.

Compare Jesse Ward with these relatives to explore successively older common ancestors:

| Relative                 | English cousin degree | Generations to the common ancestors | Common ancestor couple                  |
| ------------------------ | --------------------- | ----------------------------------- | --------------------------------------- |
| Grace Bennett (born Doe) | First cousin          | 2 on each side                      | John Doe and Jane Doe (born Hart)       |
| Lucy Reed (born Ellis)   | Second cousin         | 3 on each side                      | Arthur Doe and Nora Doe (born Hayes)    |
| Olivia Mason (born Doe)  | Third cousin          | 4 on each side                      | Edward Doe and Evelyn Doe (born Brooks) |
| Emily Brooks (born Hart) | Fourth cousin         | 5 on each side                      | Henry Doe and Alice Doe (born Mason)    |
| Nathan Doe               | Fifth cousin          | 6 on each side                      | William Doe and Clara Doe (born Reed)   |

These descriptions are derived from parent links and common ancestors, rather than explicit cousin edges or shared surnames. Record content remains user data when the interface language changes. Employment, education, court cases, gifts, loans, investments, travel, dated residences, citizenship changes and self-described identity history illustrate the optional profile modules. The demo includes deceased relatives, children under 18 and both biological and adoptive parents for Robin Roe.

The launch screen opens before loading a demo or replacing a draft. To explore this version, open the demonstration map from the home screen. Loading the updated demo does not rewrite existing saved projects.

## Workspace modes

Modes suggest compact profile sections and an initial view for a new project. Switching a mode preserves the project, complete profiles and all stored records. Use **Choose visible data** to customize the compact panel for each mode. Full editing, biographies and printing always include all sections.

| Mode                 | Main task                                                          | New project opens in            |
| -------------------- | ------------------------------------------------------------------ | ------------------------------- |
| Family and genealogy | Generations, family relationships and family history               | Map                             |
| Civil status         | Act records, certificates, registered names and family status      | People & profiles               |
| Inheritance cases    | Family paths, supporting documents, rights and competing claims    | Map                             |
| Property and rights  | Ownership, use, transfers and encumbrances                         | Map                             |
| Connection research  | Personal/professional links, sources and evidence gaps             | Map                             |
| Profiling            | Complete life histories, observations, interests and source review | People & profiles               |
| Legal cases          | Proceedings, decisions, custody periods, witnesses and evidence    | Dates & history, legal category |
| Finances and assets  | Income, assets, accounts, companies and liabilities                | Property                        |

New documents are visible in all modes unless their visibility is restricted. At import, the former default list of four modes becomes unrestricted visibility so existing documents remain available in new modes. Personal observations retain their own source, period and verification; a mode does not infer a person's characteristics.

## Civil status records

Use **Civil status** for act records, certificates and extracts. The structure follows the distinction between registration, issued documents and later annotations in the [Ukrainian civil registry instruction](https://zakon.rada.gov.ua/laws/show/z0691-08#Text). This is a data-structure reference; JurisTree does not connect to the registry or issue official extracts.

Add a record under **Personal details and documents → Civil status records** in the complete person editor. Record birth, marriage, divorce, name change, death, adoption, parentage or parental rights. Expand only the groups needed:

- Registration: act number, registry entry number, date, authority, registrar, place and record status.
- Person as recorded: surname, given name, patronymic, recorded sex, birth details, citizenship and address.
- Participants: recorded parents, spouse, child and adoptive parents, with linked people and original names. Record the basis for parentage separately.
- Issued document: original or reissued certificate, ordinary/full extract or confirmation that no entry was found, with identifiers, issue date and authority.
- Changes: names before/after, correction, restoration, annulment or parental-rights decision, grounds, related act and annotations.
- Evidence: linked source, attribution and verification. Link an existing relationship to inspect it directly from the profile or biography.

The act date, registration date and document issue date are separate values. Recorded parents are observations, rather than automatic biological parent links. Recording an act does not overwrite names, basic dates or relationship edges. Update those separately when supported by evidence. Deleting a linked person, relationship or source clears its reference while retaining the record's original names and text. Civil dates appear as one-time life-history entries, separate from celebrations.

## Detailed profiles

Open **People & profiles** to find a person, then open their complete profile. Relationships, source files, property history, editing, autobiography and PDF printing are available from that workspace. Family links open the other person's full profile; **Show on map** returns to the relationship diagram.

The person editor has a searchable section index on desktop and a section picker on phones. Search by a section, field or category, such as passport, specialty, sport or allergy. All sections are available regardless of workspace purpose. Only the name is required. Open a section, add a record, then expand only the field groups you need. Navigation and search operate on the existing form and preserve unsaved entries in hidden sections. Invalid required fields are revealed before focusing them. **Choose visible data** controls the compact person panel, while complete profiles and autobiographies include all sections.

Optional profile choices start as **Not specified**, including verification. Autobiographies and PDF reports include entered values and linked sources, omit empty sections and missing-date messages, and retain explicitly recorded verification states. Leaving verification unset does not claim that a record is verified. Existing recorded choices are preserved when importing or opening a draft.

**Hobbies and skills** is the single place for hobbies, interests, sports and abilities. A name or description is enough; category, period, frequency, proficiency and certificates are optional. **Habits and beliefs** holds routines, preferences and views. **Health** combines an optional general summary with separate medical records for conditions, allergies, treatment and dietary restrictions. Food tastes belong to preferences; medical food restrictions belong to Health. Older activity summaries are moved into Hobbies and skills when opening a saved project, preserving their text and existing detailed records. Older section visibility choices are updated to the combined sections.

The language selector stays in the preferences area at the right edge of the header on both the home screen and workspace. Navigation separates people and connections, dates and history, and records and analysis. Undo/redo is available in the map, property tools and other workspace views.

Section titles name a subject, such as **Pregnancy**, **Gender and orientation**, **Places of residence** or **Appearance and distinguishing marks**. Periods, changes and verification belong to individual records. Editing, complete profiles, section visibility, search and printed biographies use the same translated section names.

| Module                              | Available information                                                                                                                                                                                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Places of residence                 | Country, city, region, postal code, address, start/end dates or years, residence type/status, permit reference, attribution and linked sources                                                                                                                                               |
| Names and surnames                  | Maiden and birth surnames, legal and previous names, aliases, validity periods, reasons for changes and sources                                                                                                                                                                              |
| Education                           | School, college, university or course; institution, qualification, specialty/code, faculty, study mode, enrollment/end/graduation date or year, admission and diploma references, issue date and sources                                                                                     |
| Reports and statements              | Attributed reports, rumors, testimony, recording-based statements, reports of infidelity and biography clarifications; related person, context, first-hand/hearsay basis, verification status, reviewer, findings and sources                                                                |
| Identity documents                  | Document and passport type, country, series, number, issuing authority and code, issue/expiry dates, status, holder details, citizenship, personal number, registered address, machine-readable lines and a linked scan/source                                                               |
| Citizenship and immigration status  | Country, status, visa/permit category and number, validity, application and decision, case/authority, citizenship acquisition, renunciation, loss or restoration, prior citizenship, change date, residency type, citizenship basis, purpose, sponsor, travel dates, address and conditions  |
| Appearance and distinguishing marks | Dated height and weight measurements, build, eye/hair color, glasses, distinguishing marks, tattoos, description and attribution                                                                                                                                                             |
| Health                              | General summary with linked sources; individual conditions, allergies, medication, vaccination, restrictions, permitted/avoided foods, status, severity, treatment, practitioner, institution, record/book number, review dates and sources                                                  |
| Hobbies and skills                  | Hobby, interest, activity, skill, sport, martial art or weapons proficiency; optional category, level, frequency, start/end dates or years, current/past/paused/planned activity, qualifications, certificates and attribution                                                               |
| Weapons and permits                 | Type, model, serial number, ownership status, acquisition/disposal dates, permit reference, authority, expiry, storage and attribution                                                                                                                                                       |
| Travel and border crossings         | Countries and cities, departure, entry, exit and return dates, purpose, status, route, border crossing, passport/permit references, address and sources                                                                                                                                      |
| Tax information                     | Country and year, tax ID and residence, currency, declaration metadata, income, deductions, credits, tax due/paid/refund, assets, liabilities and foreign accounts                                                                                                                           |
| Habits and beliefs                  | Character, habits, routine, lifestyle, food tastes, attraction, charitable activities, values, religious or political views and preferences, with description, attribution, reporting date, context, start/end dates or years, current/past/paused/planned activity and source               |
| Court cases and proceedings         | Administrative/criminal offenses, investigations, charges, acquittals, cases, property division, claims, hearings and judgments; case/proceeding number, registration date, jurisdiction, legal provision, authority, decision reference/URL, role, counterparty, status, outcome and source |
| Custody and imprisonment            | Detention, pretrial custody, imprisonment, house arrest and release; start/end dates or years, facility/address/country, case and proceeding, charge and conviction provisions, charge description, sentence, credited time, actual release date/grounds, attribution and source             |
| Financial history                   | Income, expenses, gifts, debts, loans, deposits, investments, guarantees and obligations; spending category, amount, currency, direction, counterparty, institution, contract, deadline, interest, frequency, status, collateral and attribution                                             |
| Employment and service              | Organization, department, role, current/former status, appointment or election, rank, work period, country, address, contract, supervisor, income, currency, pay frequency, appointment reference, attribution and source                                                                    |
| Gender and orientation              | Dated self-descriptions of gender identity, legal sex or orientation, and separately entered hormone treatment or procedure records; provider, country, attribution, verification and source                                                                                                 |
| Pregnancy                           | Start, expected delivery and end dates, outcome (including miscarriage, stillbirth and termination), gestation, linked child, reported other parent, parentage verification, circumstances, provider, record number and attribution                                                          |
| Death and burial                    | Date, category, reported cause, circumstances, investigation and certificate; burial date, country, locality, address, cemetery, plot, grave or niche number, map link and source                                                                                                            |
| Military service and records        | Service, registration, reserve, training, awards and discharge; country, branch, unit, role, rank, service periods/status, military ID and service numbers, registration office, specialty, fitness category, appointments, discharge and sources                                            |
| Witnesses and testimony             | Event, date, place, linked person or external witness, role, reported statement, contact, interview date, statement reference, availability, reviewer, verification and source                                                                                                               |
| Contacts and social networks        | Phone, email, social profile, messenger, website or other contact; platform, username, HTTP/HTTPS URL, current/former status, periods, attribution and source                                                                                                                                |
| Assets                              | Asset type and identifier, country/location, registered and beneficial ownership, holder/controller references, ownership share, value/currency, valuation/discovery dates, registry, periods and attribution                                                                                |
| Property restrictions               | Attachment, seizure, freeze, lien, pledge or mortgage; affected asset/account identifier, authority, case/order, dates, active/lifted status, scope, amount/currency, beneficiary and attribution                                                                                            |
| Financial accounts                  | Bank, brokerage, payment or custody accounts; institution, country, account number, IBAN, SWIFT/BIC, holder/role, status, opening/closure, recorded balance/date, restrictions and attribution                                                                                               |
| Cryptoassets                        | Public wallets, holdings and exchange accounts; asset/symbol, network, address, contract, platform, quantity, ownership, holder, dated valuation, transactions, restrictions and attribution                                                                                                 |
| Company involvement                 | Company/registration/tax identifiers, jurisdiction, role, direct/indirect/beneficial/nominee interest, share and voting percentages, share class/count, capital contribution, intermediary, control, periods and attribution                                                                 |
| Sanctions and associations          | Direct designation or association, regime, authority, jurisdiction, measure, status, list identifier, legal instrument, listing/removal/check dates, official URL, related person/entity and attribution                                                                                     |
| Political party affiliation         | Party, abbreviation, country, membership/candidacy/support/donation, branch, role, membership reference, current/former status, periods and attribution                                                                                                                                      |
| Custom facts                        | A category, label, value, period, notes and source for details beyond the predefined fields                                                                                                                                                                                                  |

Dates and numeric amounts are validated during editing and import. Monetary values retain the entered precision, including zero, and are not calculated automatically. Records under **Habits and beliefs** store entered descriptions and their attribution; the application does not infer beliefs or make psychological assessments. These modules capture information and sources, rather than generate country-specific migration or tax forms. Court and financial counterparties can be linked to an existing person or entered as an external party. Monetary records do not automatically create reciprocal entries or calculate account balances. Gender, orientation and treatment records retain their independent dates and attribution; they do not infer one another or automatically overwrite the basic gender field.

Identified assets form a per-person inventory, separate from the central property history and its proposed inheritance/allocation plan. Reuse an asset or account identifier in a restriction record to find both through search. Restrictions record their own dates and status; they do not change ownership or account balances automatically.

Company interests are per-person records. Use separate entries for different roles, share classes and periods, and consistent registration identifiers across profiles. Registered and beneficial interests can overlap; the application does not add them together or calculate indirect ownership. Account balances, crypto quantities and valuations are dated, manually entered observations, with their original decimal strings preserved. There are no live balance, pricing or blockchain queries.

A direct sanctions designation and an association with a designated person or entity are distinct record types. An association does not designate the other party. Enter the regime, list reference, status, dates, official URL and verification independently; there is no automatic sanctions screening or propagation. Party affiliation is dated history, separate from recorded political views in Habits and beliefs.

## Property history and competing claims

Open **Property and shares**, add a property with its identifier, country, location and optional valuation, then choose **Property history and analysis**. Use the date selector to inspect the recorded holders and users at a particular point in time. Search the property list by entered values, participant names or linked source metadata; filter it to open claims or records needing review.

Each property has three independently editable collections:

| Collection                     | Contents                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rights and use periods         | A person or external party; registered ownership, use, lease, beneficial interest, possession or management; share if known; inclusive start/end dates or years; ongoing/ended/disputed status; grounds, registration requisites, source and verification.                       |
| Transfers                      | Gift, sale, inheritance, registration, division, exchange or assignment; sender and recipient, internal or external; right type, share, effective date/year, signing and registration dates, payment/currency, conditions and evidence. Enter a separate row for each recipient. |
| Claims and competing interests | Possible, submitted, disputed or resolved claims; claimant, related/deceased person forming the basis, respondent, claimed share, grounds, missing evidence, dates, case/reference and verification.                                                                             |

**Analyze as of** shows ownership separately from use or management. Missing shares remain unknown. Missing dates and ambiguous year boundaries are flagged; a year is never turned into an invented exact day. A right with no end date requires an explicitly ongoing status to be shown as a definite active period up to today. Refuted rights are retained in history and excluded from the snapshot. Unknown or incomplete periods are listed for clarification. Claims close on their recorded resolution date; year-only boundaries remain conservative. The chronology retains all historical and future entries while the snapshot and review use the selected date.

The review identifies missing dated ownership, incomplete periods/shares, known ownership shares exceeding 100%, open claims, unverified or missing sources, undated transfers, missing recipient periods, missing sender ownership or insufficient recorded shares, and an explicitly dated signing after the sender's recorded death. Findings appear beside the affected records. A later registration or inheritance distribution is not treated as a contract signed by the deceased. Review findings concern entered evidence and consistency; they do not decide title, legal validity, limitation periods or entitlement.

A transfer does not automatically create or close a right, and it does not settle another person's claim. Record the resulting periods and any claim decision explicitly. A recognized claim is not silently converted into an ownership period. The reference/estate owner anchors the family comparison and existing proposed allocation plan; selecting that person does not establish actual ownership. Proposed allocations remain separate from recorded rights. Per-person identified asset observations are also separate and are not merged or counted twice automatically.

The demonstration includes the **Riverside agricultural parcel**. Inspect **1920-01-01** for Henry and Charles Doe's half shares, **1932-07-01** for Alice Doe's registered title, and **1933-01-01** for the gifts to Edward Doe and Florence Hart. Albert Doe's objection through his father Charles remains open after the gifts. A later inquiry by Nathan Doe explicitly needs the intervening succession chain. Current ownership is left unknown where later title records are missing. Participant and claimant relationships are derived from the family tree without declaring heirs or assigning legal shares.

Property history and all linked source references appear in every participant's complete autobiography and printed/PDF report, including external parties and records outside the visible workspace. Global search includes ledger values and participant names. Dated property records appear as one-time entries in **Financial chronology**, with a link back to the property; they are never family anniversaries. Edits support undo/redo, draft saving and ZIP backup. Deleting a person preserves the historical party's name in external-party fields or context notes; deleting a source clears the reference while retaining the history.

The separation of title records, family links and supporting estate documents follows the public [court information on proof of inheritance](https://court.gov.ua/press/news/2031269). This is an information-structure reference, not a registry integration or a jurisdiction-specific inheritance engine.

## Information structure references

The following public examples inform field grouping and terminology. They are design references, not integrations or a claim of compliance with a registry's data model. Information and attached evidence are entered locally by the user.

| Reference                                                                                                           | Application in JurisTree                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Diia education documents](https://diia.gov.ua/news/osvitni-dokumenti-vzhe-v-zastosunku-diya)                       | Education is separate from employment; institution, qualification, specialty and document requisites remain distinct.                                                     |
| [Opendatabot court data](https://opendatabot.ua/open/court)                                                         | Cases, hearings and decisions retain searchable references, dates and parties rather than being family anniversaries.                                                     |
| [ERDR regulation](https://zakon.rada.gov.ua/laws/show/v0298905-20#Text)                                             | Criminal proceeding number, registration date and legal qualification are separate fields. An allegation, proceeding and conviction remain distinct entered descriptions. |
| [Verkhovna Rada legislation portal](https://zakon.rada.gov.ua/)                                                     | Legal provisions, authority and decision references are recorded explicitly; a provision is not inferred from narrative text.                                             |
| [LIGA360 solutions](https://www.liga360.biz/individualni-rishennya-liga360)                                         | Legal research, person/company connections and dated evidence remain accessible through separate records and combined search.                                             |
| [ARMA questions and answers](https://arma.gov.ua/index.php/pytannya-vidpovid)                                       | Asset identification, restrictions, grounds and authority references remain separate from ownership and the inheritance allocation plan.                                  |
| [State Migration Service ID document guidance](https://dmsu.gov.ua/faq/pasport-gromadyanina-ukrajni-id-kartka.html) | Holder details, passport requisites, issue/expiry/authority and immigration/residence history have separate fields.                                                       |
| [State Migration Service identification forms](https://dmsu.gov.ua/assets/files/doc/urist_1.pdf)                    | Neutral identifying terms, including distinguishing marks, inform concise section and field labels.                                                                       |
| [Civil status registry extract rules](https://zakon.rada.gov.ua/laws/show/z0691-08)                                 | Names and name changes, birth, marriage and death retain dated civil-status records and linked documentary sources.                                                       |

## Relationship history and source verification

Choose **Registered marriage** for marriage or a registered civil partnership. Choose **Partnership / dating** for an unregistered union, cohabitation, dating, romantic relationships, an affair / lovers or another partnership. An affair is an explicitly entered subtype; overlapping dates do not classify a relationship automatically. Add the subtype, status, duration pattern, start/end dates, place and registration reference as applicable. Use separate records for separate episodes between the same people. Relationship period fields use `fromDate` and `toDate`; `from` and `to` remain person IDs.

Use **Parenthood** for biological parents, **Adoption** for adoptive parents and **Step-parent / step-child** for a parent's partner who is not recorded as a biological or adoptive parent. A child can have biological and adoptive records at the same time. Step-parent links remain visible but do not establish biological or adoptive ancestry. Half-sibling descriptions require both people to have at least two recorded biological parents and exactly one shared parent; unknown parents are not guessed.

Choose **Work / service connection** for professional or business connections, **Subordination** for reporting lines, or **Sanctions-related connection** for a recorded association. These types support organization, department, formal/informal/mixed character, each person's role, reference, periods, current/ended status and verification. For subordination, select the subordinate first and the manager second: the arrow points **subordinate → supervisor**. Profiles show the other person's role from the selected person's perspective. Multiple periods and organizations can connect the same people. These links do not establish family ancestry or inheritance paths. Graph analysis uses **Follow arrows** or **Reverse arrows** for both parental and reporting connections; the former follows parent → child and subordinate → supervisor.

Each relationship can record its quality (good, neutral, difficult, hostile or mixed), social context, context notes, verification, attribution and review notes. Explicitly unverified or refuted links remain visible on the graph but do not establish kinship or inheritance paths. Dating and cohabitation are social links. Ended or divorced marriages are retained as history and excluded from current kinship paths. Disputed family links remain marked as disputed.

Reports in a person's profile are separate statements, each with its own verification state. A recording can support multiple reports without automatically confirming them. Sources also have a separate review status, reviewer, review date and findings. Photographs, letters, testimony and recordings are indirect evidence; rumors remain unverified. Marking a recording as reviewed cannot turn it into an official family certificate.

Attach audio/video recordings up to 20 MB, or reference larger recordings with an external source link. Supported formats are MP3, M4A, WAV, OGG, WebM, MP4 and MOV. Local files have browser-native playback controls; codec support depends on the browser. Transcriptions can be entered alongside the source. Media and verification metadata are included in ZIP backups.

## Calendar and working tools

Open **Calendar** in the navigation to browse a month, select a day and read its agenda. Switch to **Year** for all 12 months, type a year directly, or use the arrows to move by whole years. Select a month tile to open its daily agenda. The month picker also accepts a direct month/year choice. Search by person or event and filter by category. The calendar uses all populated profile sections independently of **Choose visible data**, and respects the selected family-group filter.

Both **Events and history** and **Calendar** open in **Family dates**, containing birthdays, memorials, wedding anniversaries, explicitly entered family dates and pet dates. Choose **Life chronology** for education, residence, work, travel, immigration, health, service, interests and views; **Legal chronology** for court proceedings, custody, testimony and sanctions; or **Financial chronology** for assets, accounts, obligations and company interests. The type filter only offers types from the selected category. Changing categories clears that type filter. Legal and financial dates are one-time records and never become annual celebrations.

Birthdays, memorial dates and current recorded wedding anniversaries repeat each year. Ended partnerships retain their original start and end dates without generating current wedding anniversaries. Every fifth birthday or wedding anniversary receives a jubilee badge; memorials and death anniversaries do not. Custom jubilees can be entered explicitly. February 29 anniversaries appear on February 28 in common years. Dates containing only a year remain listed separately until an exact day is supplied. **Add event** in Family dates uses the selected day and supports annual or one-time family events with notes and a source.

In Legal chronology use **Add court record** or **Add custody record**, choose the person, then complete the focused profile section. Other chronology categories offer **Add record** with a person and section picker. Editing a dated entry opens its originating profile section or relationship. The profile editor and visibility settings share a single ordered hierarchy of identity/civil records, life/education, personal interests, health, legal/evidence and financial information. Additional sections remain available without expanding all forms at once.

Education has its own section, separate from employment. Add one record per school, institution or study period. Hobby, interest, habit and view records also have independent periods and activity states; add a new record when a description changes over time. Free-text hobby and interest summaries remain available for an undated overview. All structured records appear in the complete biography and its printable report even when hidden in the current workspace.

Use the star on a person card or in the profile panel to add or remove a favorite. Favorites are saved in the project, participate in undo/redo and travel in ZIP backups. They stay accessible when the people search or family-group filter changes.

Drag a dialog or profile window by its header. Windows remain inside the viewport and can be reset with the layout button in the header. Focus a header and use **Alt + arrow keys** to move it, or **Alt + Home** to reset. Positions are temporary workspace state; a newly opened dialog starts in its default position.

## Life history and biography review

Pregnancy records retain separate outcomes, clinical references, a linked child, reported other parent and parentage verification. An ongoing pregnancy cannot have an end date. These references do not create parenthood edges or change basic gender. Death accounts retain circumstances, investigation and certificate details without overwriting the basic death date or life status. Use one military record per posting or service period, and separate records of type **Award** for multiple awards and decrees.

Add a witness record to the person the event concerns. Select an existing person or enter an external witness. Store the reported statement, dates, interview, contact, availability, verification and source. A linked witness's autobiography also shows **Statements about other people**, with the subject and source. Witness availability does not establish corroboration.

Contact values link safely using `tel:`, `mailto:` or HTTP/HTTPS. Unsupported schemes remain plain text; the separate URL field rejects them. Demo contacts use reserved `.invalid` domains and a reserved fictional phone number.

Open **Biography review** from the person panel or autobiography. Choose exact start/end dates, a minimum gap in days (180 by default) and all dated records or only explicitly corroborated records. The default period starts on the eighteenth birthday; for a minor it starts at birth. A missing birth date requires an explicit start. The end is bounded by today and the recorded death date.

Coverage comes from education, residence, work and military service periods declared by their section modules. Adjacent or overlapping periods merge. Only explicitly current or active records extend an open end to the review end; an absent end date alone does not establish continuity. Refuted and future periods are excluded. Year-only starts use December 31 and year-only ends use January 1, conservatively retaining uncertain boundaries for clarification. Missing dates and unverified records are listed separately. A residence can cover a period without employment, so coverage does not mean uninterrupted employment.

A gap means that no eligible dated record covers that period. It is not proof of misconduct or a reputation assessment. Record follow-up questions, explanations and sources in **Reports and statements**. The review does not modify data. It can support biographical review, including a marriage agency's review of information supplied by a person, without inferring undisclosed conduct or personal characteristics.

## Selection-relative family roles

Selecting a person colors and labels related cards using the complete recorded family graph: parents, children, spouses/partners, full/half siblings, grandparents, grandchildren, aunts/uncles, nieces/nephews, distant cousins and relatives through marriage. Cousins retain their degree and generation difference. Direct adoptive parents/children and stepfamily have explicit labels; adoption and disputed links in longer paths appear in the badge tooltip and accessible card description. Unverified/refuted links do not establish kinship, and social/professional links do not create family roles. Family groups and visible-map filters do not change the underlying calculation.

The map key identifies the selected person and explains card colors separately from source-state line colors. Long role labels wrap above the card. Changing selection, language or relationship data refreshes the roles. A shared adjacency/ancestry index serves each calculation/render, and role results are cached across view redraws. SVG/PNG diagram exports omit temporary selection-relative highlights.

## Advanced people filters

Open **People filters** beside the global search bar. Quick conditions add living/deceased people, minors, people with/without identity document records or available sources, birthdays or anniversaries within 30 days, no recorded children and recorded adoption. A quick condition replaces existing conditions on the same field. Add custom conditions and choose **Match all (AND)** or **Match any (OR)**, including repeated country conditions for trips to multiple destinations. Each set supports up to 20 conditions.

Conditions cover life status, age ranges, gender, favorites, identity document records, available sources, source references, attached files, official sources, records awaiting review, children/adoption, days until birthdays/anniversaries, identified asset shares and counts, accounts, crypto records, companies, visited countries, residence/citizenship history, party affiliation, sanctions record type, any populated profile section, family groups and the existing all-value search syntax.

Preview the matching people and summary counts, sort by name, age, upcoming birthday or asset amount in a chosen currency, then **Apply to map and list**. The sidebar's group filter also applies; the sidebar's name search can further narrow its list. The active result bar shows the count and a clear action, including when there are no matches. Relationship display filters and graph analysis remain separate. Global search and favorites can open any person; selecting a person outside the people filter clears it so that the selected person can be displayed. Full diagram exports and complete biographies retain all project data; the current-diagram export respects the visible filter.

Save a named set to reuse it in this project. Up to 20 sets are stored in `personFilterViews` and included in ZIP/JSON backups. Saving/deleting a set participates in undo/redo. Active filters are temporary view state: starting/importing another project resets them. Export CSV from the preview to download every matching row, independently of result pagination. The CSV includes the evaluation date, age bounds, source/file/child counts, adoption, next dates, destinations and separate asset columns by currency. Its English column names are stable; potentially executable spreadsheet formula prefixes in user values are escaped.

The query engine keeps unknowns explicit. Missing age or amounts do not satisfy a numeric or negative condition; use **No recorded value** to find them. A partial birth year matches a numeric range only if the entire possible age interval fits. Deceased people use their age at the exact recorded death date; unknown death dates leave their age unknown. The under-18 filter excludes deceased people and uncertain eighteenth-birthday boundaries. Zero children means no qualifying biological/adoptive links are recorded, not a claim about a person's actual family. Unverified/refuted links and step-parent links do not contribute to this count.

Identity document counts cover non-refuted entries in the person's dedicated section, including historical passports/IDs; their presence does not establish validity or an attached scan. Source counts use direct person/subject links and profile source references across all workspace modes. Available sources exclude refuted records; attached files must exist in the current browser's attachment collection. A reference without a file, a requested document and an available official source are different conditions. Travel destinations require a completed trip or an actual entry date on/before the evaluation date; planned/cancelled and refuted records are excluded. Countries remain entered text, with case-insensitive matching and suggestions from project records. Residence, citizenship, party, company and sanctions criteria describe recorded history rather than infer current legal status. Anniversaries include eligible current weddings, memorial dates and recurring profile events, with both partners included and leap days handled consistently with the calendar.

Asset amount conditions require an explicit currency and use current `assetRecords` values multiplied by known ownership percentages. They exclude disposed, ended, future and refuted observations; for repeated identifiers in one profile, the latest dated observation is used. Missing currency/value/share is reported as incomplete and contributes no amount. Decimal observations are accumulated before conversion to a browser number. There is no currency conversion, net-worth calculation or automatic addition of accounts, crypto valuations, company shares or the property allocation plan. Overlapping nominal/legal/beneficial interests are not consolidated. Amounts remain indicative recorded estimates.

## Global search and printable biographies

The search bar at the top of every workspace searches all stored values, including optional sections hidden in the current view. Results include people, sources, relationships, property and family groups. Source transcriptions and metadata are searchable; binary attachments are not automatically transcribed or indexed. Linked source and relationship context can also match a person.

Combine terms with spaces (all must match), quote a phrase, use `|` between alternatives, and prefix an excluded term with `-`. Optional field filters are `name:`, `gender:`, `document:`, `country:` and `type:`. Ukrainian and Russian aliases work too, including `ім’я:`, `прізвище:`, `стать:`, `документ:`, `країна:`, `имя:`, `фамилия:`, `пол:` and `страна:`. Name filters include recorded former names and surnames. Gender filters match the stored basic gender exactly; they do not infer it from identity history.

Examples:

```text
name:Robin gender:male Guitar
name:Jesse document:PA7314062 62.5
country:"United Kingdom" | country:Canada
прізвище:Avery стать:небінарна
name:Doe -document:expired
```

Press **Ctrl/Cmd + K** to focus search, use arrow keys and Enter to open a result, or Escape to close results. Workspace visibility and family-group filters do not restrict global search.

Selecting a person from search, the person list or working people opens the map, centers the card in the available space and zooms to a readable scale. Map settings and the legend collapse so they do not hide the result. On phones and tablets the person panel closes; tap the card to reopen it. Floating desktop panels keep their position, and the camera avoids them. Selecting a card directly on the map keeps the current position and zoom.

Open a person's **Autobiography**, then choose **Print / Save as PDF**. In the browser print dialog select a printer or **Save as PDF**. The A4 report includes all populated sections, relationship details, property and linked source metadata, with no workspace controls. It uses the selected interface language. File attachments remain in the editable ZIP backup; the report includes their references rather than embedding their contents. Cancelling or finishing print returns to the unchanged on-screen profile.

## Person status and residence periods

A heart and **Living** label indicate an explicitly recorded living status. A candle and **Deceased** label indicate a recorded death or deceased status. An empty death date does not imply the person is alive: unspecified life status displays **Unknown**. A separate **Under 18** badge uses the recorded birth date and today's local date. Birth years that span the 18-year boundary display **18?**, with an explanatory tooltip, rather than assuming an age. Deceased people retain their life badge without a present-day minor marker. For leap-day births the display uses February 28 as the birthday in non-leap years; this is a display convention, not a jurisdiction-specific legal rule.

Biological parenthood, adoption and step-parenthood are independent relationship types. Adding an adoptive parent does not replace biological parents. Both sets remain in the profile, autobiography and diagram. Unverified relationships retain their evidence state.

To record where someone lived, open the person editor and choose **Residence history by country** from its section index. Add a separate record for each country or residence period. Start/end fields accept full dates or years; an open end is supported. Expand residence details for type, current/former/planned status and permit references. Residence data is included in search, autobiography, print/PDF, dated events and ZIP backups. Earlier address-only residence records still use the same persisted array and retain their fields.

The navy, pale blue and gold palette follows the [Franciscans reference website](https://l2.franciscans.dev/uk). `src/core/theme.js` owns the shared color tokens, applied as CSS custom properties and used directly in person-card SVG exports. Typography retains the existing Tahoma/Verdana/DejaVu Sans stacks. Workspace height is calculated by the shell's flex layout; tablet panels and mobile navigation use the shared header offset to avoid covering search.

## Using the map on a phone

Arrange cards manually, then open **Saved views** beside **Layout**, enter a name and choose **Save current view**. Each view stores all card positions, group collapse states, zoom, map center and display filters, including connection-search focus. Select a saved view to restore it after automatic layout. Use its edit button to rename, replace it with the current arrangement or delete it. Up to 20 views are kept in the tree's local draft and ZIP archive. Restoring moves existing cards without reverting profile edits or relationships; people added later keep their placement. On another screen size, the same map center and zoom are retained.

- Drag anywhere on the map, including a card, to pan. Pinch with two fingers to zoom; tap a person to open the bottom sheet.
- Use the person focus button to center the selected person at a readable scale. The fit button shows the entire map.
- Enable **Move cards** to rearrange person cards with one finger. Turn it off to resume panning over cards. Movement supports undo/redo; cancelled gestures restore the card position.
- Expand **Map tools** for saved views, layouts, filters, connection search and other map settings. Open the navigation menu for people, sources and other workspace views.

## Data and backups

The current draft and its attachments are stored together in IndexedDB under `juristree-draft-v1`. The interface language is stored in localStorage. A saved draft belongs to that browser profile and origin; it does not sync between devices. Browser storage availability and capacity depend on the browser.

Export ZIP for a portable, editable backup.

Archive filenames include the map title and the export date and time, for example `Doe family_2026-10-09_18-35-42.zip`. The timestamp uses the device's local time with seconds and sorts chronologically for the same title. The filename and the archive's UTC `exportedAt` metadata refer to the same instant.

An archive contains:

```text
tree.json                  Complete project data and attachment manifest
attachments/<id>.<ext>     Attached binary files
README.txt                 English archive instructions
```

The canonical archive model is `format: "juristree", version: 1`. This implementation accepts JurisTree archives and JSON with that schema; it does not include a migration adapter for the original prototype's `rodovid` format. JSON describes the model but cannot restore binary files on its own. PNG and SVG are image exports, not editable backups.

Images are cropped and compressed locally; their untouched originals remain outside the application. PDFs, TXT, DOCX, audio and video attachments retain their original bytes. DOCX contents are not parsed. External source links support HTTP and HTTPS only.

At the draft/archive boundary, earlier detention/imprisonment/release entries move from legal records to custody; legal timeline entries become court records with one-time dates; study entries from the former combined work/study section become education records. IDs, periods, sources and attribution are retained. Additional work/study details are retained in notes. The canonical editor and collector then use only the dedicated sections; importing the same archive again does not duplicate entries.

Import validation checks IDs, collection limits, relationship endpoints, generation cycles, calendar dates, property shares and source URLs. ZIP validation also checks entry counts, declared sizes, paths, encryption and checksums before restoring the project.

| Collection                  |  Limit |
| --------------------------- | -----: |
| People                      |    600 |
| Relationships               |  2,500 |
| Sources                     |  1,200 |
| Family groups               |    150 |
| Property records            |    500 |
| Records per profile section |    200 |
| Total attachments           | 100 MB |
| PDF attachment              |  12 MB |
| TXT or DOCX attachment      |   5 MB |
| Audio or video attachment   |  20 MB |

These are import and attachment limits. Hobbies and skills permits two extra records to preserve earlier hobby and interest summaries when a saved section already contains 200 records. Large projects can still be constrained by browser memory, storage and canvas export dimensions. Use SVG for oversized diagrams.

## Scope

Evidence labels and property shares reflect user-entered information. Kinship calculations describe recorded relationships. JurisTree does not determine legal inheritance rights or automatically produce jurisdiction-specific legal requirements.

GEDCOM, draw.io and IBM i2 files are not supported. There is no collaborative editing, cloud synchronization or automatic backup outside the browser.

See [third-party notices](../THIRD_PARTY_NOTICES.md) for the licenses of locally included JSZip and icon assets.
