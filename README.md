# JurisTree

JurisTree is a multilingual workspace for family relationships, personal profiles, documents, evidence, events and property planning. It runs entirely in the browser and can be hosted on GitHub Pages.

The application uses native JavaScript ES modules and plain CSS. It has no backend, accounts, remote database, production Node.js runtime or CDN dependency. JSZip and SVG icons are included locally.

## Features

- Family, inheritance, property, research and blank project templates.
- People, family groups and eight relationship types, including biological parenthood, adoption, step-parenthood and acquaintance.
- Interactive SVG map with dragging, zoom, multiple selection, filters and generation, circle or network layouts.
- Touch navigation with one-finger panning, two-finger zoom, readable person focus and an explicit card movement mode. Mobile controls are collapsible and the person panel opens as a bottom sheet.
- Shortest and alternative paths, neighborhoods, common connections and connecting networks.
- Kinship descriptions based on recorded relationships, including half-siblings when both biological parent sets are recorded.
- Favorite people in a sidebar list and a quick-access strip; selecting a favorite centers their card at a readable scale across map filters.
- Draggable dialogs and profile windows, with viewport bounds, touch support, keyboard movement and a reset-position control.
- Document references, digital attachments, evidence states and configurable checklists.
- Profiles with contacts, residence history, biographies, work, education, interests, health information and pets.
- Optional identity documents, citizenship and immigration records, tax declarations, personal portrait entries and custom facts. Each section supports multiple records, dates, notes and linked sources.
- A complete autobiography view for every person, available from the map, people list and profile panel. It includes populated profile sections regardless of workspace visibility, family relationships, property, notes and linked sources with attachments.
- Month and year calendar views with direct year navigation, birthdays, wedding anniversaries, jubilees, memorial dates, travel, medical reviews, status changes and other dated records.
- Global search across all stored values and linked context, with combined queries, field filters, keyboard navigation and multilingual terms.
- A4 autobiography printing and browser Save as PDF, including every populated section and source reference.
- Upcoming anniversaries and a historical timeline, including partial dates and leap-day handling.
- Property records with manually entered allocation shares.
- Undo/redo, browser draft storage, portable ZIP archives and PNG/SVG image export.
- English, Ukrainian and Russian interfaces, displayed as **EN / UA / RU**.

The expanded demo contains 12 people, 18 relationships and nine source references using explicit Doe/Roe placeholders. Surname changes have name-history records. Biological, adoptive and step-parent relationships are separate, including children from previous partnerships and half-siblings. Employment, public office, court cases, imprisonment, gifts, loans, deposits, investments and self-described identity history illustrate the optional modules.

Demo people use explicit Doe/Roe placeholders. Their relationships, identity document numbers and personal details are invented. The launch screen opens before any demo is loaded or existing draft is replaced. Loading the updated demo does not rewrite existing saved projects.

## Detailed profiles

Open a person's editor and expand **Add more information** to use sections outside the current workspace's visible scope. Select a section, add a record, then expand only the field groups you need. All sections remain editable regardless of workspace visibility. **Choose visible data** controls the sections in the person panel; the complete autobiography includes every populated section.

| Module                         | Available information                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name history                   | Maiden and birth surnames, legal and previous names, aliases, validity periods, reasons for changes and sources                                                                                                                                                                                        |
| Education                      | Institutions, degrees, fields of study, level, faculty, study periods/status, graduation dates, diploma references and sources                                                                                                                                                                         |
| Reports and claims             | Attributed reports, rumors, testimony or recording-based statements, context, first-hand/hearsay basis, verification status, reviewer, findings and sources                                                                                                                                            |
| Identity documents             | Document and passport type, country, series, number, issuing authority and code, issue/expiry dates, status, holder details, citizenship, personal number, registered address, machine-readable lines and a linked scan/source                                                                         |
| Citizenship and immigration    | Country, status, visa/permit category and number, validity, application and decision, case/authority, citizenship acquisition, renunciation, loss or restoration, prior citizenship, change date, residency type, citizenship basis, purpose, sponsor, travel dates, address and conditions            |
| Appearance                     | Dated height and weight measurements, build, eye/hair color, glasses, distinguishing marks, tattoos, description and attribution                                                                                                                                                                       |
| Medical and dietary records    | Conditions, allergies, medication, vaccination, restrictions, permitted/avoided foods, status, severity, treatment, practitioner, institution, record/book number, review dates and sources                                                                                                            |
| Skills and hobbies             | Activity, skill, sport, martial art or weapons proficiency, level, frequency, periods, qualifications, certificates and attribution                                                                                                                                                                    |
| Weapon ownership               | Type, model, serial number, ownership status, acquisition/disposal dates, permit reference, authority, expiry, storage and attribution                                                                                                                                                                 |
| Travel history                 | Countries and cities, departure, entry, exit and return dates, purpose, status, route, border crossing, passport/permit references, address and sources                                                                                                                                                |
| Tax information                | Country and year, tax ID and residence, currency, declaration metadata, income, deductions, credits, tax due/paid/refund, assets, liabilities and foreign accounts                                                                                                                                     |
| Personal portrait              | Character, habits, routine, lifestyle, food tastes, attraction, charitable activities, values, religious or political views and preferences, with description, attribution, reporting date, context, period and source                                                                                 |
| Court and custody history      | Administrative/criminal offenses, investigations, charges, acquittals, cases, property division, claims, hearings, judgments, detention, imprisonment and release; legal provision, fines, dates, case number, court, role, counterparty, status, outcome, sentence conditions, attribution and source |
| Financial history              | Income, expenses, gifts, debts, loans, deposits, investments, guarantees and obligations; spending category, amount, currency, direction, counterparty, institution, contract, deadline, interest, frequency, status, collateral and attribution                                                       |
| Employment and public office   | Organization, role, appointment or election, rank, work period, location, income, currency, pay frequency, appointment reference, notes and source                                                                                                                                                     |
| Gender and orientation history | Dated self-descriptions of gender identity, legal sex or orientation, and separately entered hormone treatment or procedure records; provider, country, attribution, verification and source                                                                                                           |
| Custom facts                   | A category, label, value, period, notes and source for details beyond the predefined fields                                                                                                                                                                                                            |

Dates and numeric amounts are validated during editing and import. Monetary values retain the entered precision, including zero, and are not calculated automatically. A personal portrait stores entered descriptions and their attribution; it does not infer beliefs or make psychological assessments. These modules capture information and sources, rather than generate country-specific migration or tax forms. Court and financial counterparties can be linked to an existing person or entered as an external party. Monetary records do not automatically create reciprocal entries or calculate account balances. Gender, orientation and treatment records retain their independent dates and attribution; they do not infer one another or automatically overwrite the basic gender field.

## Relationship history and source verification

Choose **Registered marriage** for marriage or a registered civil partnership. Choose **Partnership / dating** for an unregistered union, cohabitation, dating, romantic relationships or another partnership. Add the subtype, status, duration pattern, start/end dates, place and registration reference as applicable. Use separate records for separate episodes between the same people. Relationship period fields use `fromDate` and `toDate`; `from` and `to` remain person IDs.

Use **Parenthood** for biological parents, **Adoption** for adoptive parents and **Step-parent / step-child** for a parent's partner who is not recorded as a biological or adoptive parent. A child can have biological and adoptive records at the same time. Step-parent links remain visible but do not establish biological or adoptive ancestry. Half-sibling descriptions require both people to have at least two recorded biological parents and exactly one shared parent; unknown parents are not guessed.

Each relationship can record its quality (good, neutral, difficult, hostile or mixed), social context, context notes, verification, attribution and review notes. Explicitly unverified or refuted links remain visible on the graph but do not establish kinship or inheritance paths. Dating and cohabitation are social links. Ended or divorced marriages are retained as history and excluded from current kinship paths. Disputed family links remain marked as disputed.

Reports in a person's profile are separate statements, each with its own verification state. A recording can support multiple reports without automatically confirming them. Sources also have a separate review status, reviewer, review date and findings. Photographs, letters, testimony and recordings are indirect evidence; rumors remain unverified. Marking a recording as reviewed cannot turn it into an official family certificate.

Attach audio/video recordings up to 20 MB, or reference larger recordings with an external source link. Supported formats are MP3, M4A, WAV, OGG, WebM, MP4 and MOV. Local files have browser-native playback controls; codec support depends on the browser. Transcriptions can be entered alongside the source. Media and verification metadata are included in ZIP backups.

## Calendar and working tools

Open **Calendar** in the navigation to browse a month, select a day and read its agenda. Switch to **Year** for all 12 months, type a year directly, or use the arrows to move by whole years. Select a month tile to open its daily agenda. The month picker also accepts a direct month/year choice. Search by person or event and filter by category. The calendar uses all populated profile sections independently of **Choose visible data**, and respects the selected family-group filter.

Travel, immigration status changes, medical review dates, qualification expiry, weapon permit expiry, court, work, education and financial dates appear alongside family events. Birthdays, memorial dates and current recorded wedding anniversaries repeat each year. Ended partnerships retain their original start and end dates without generating current wedding anniversaries. Every fifth annual anniversary receives a jubilee badge; custom jubilees can also be entered explicitly. February 29 anniversaries appear on February 28 in common years. Dates containing only a year remain listed separately until an exact day is supplied. **Add event** uses the selected day and supports annual or one-time events with a category, notes and a source.

Use the star on a person card or in the profile panel to add or remove a favorite. Favorites are saved in the project, participate in undo/redo and travel in ZIP backups. They stay accessible when the people search or family-group filter changes.

Drag a dialog or profile window by its header. Windows remain inside the viewport and can be reset with the layout button in the header. Focus a header and use **Alt + arrow keys** to move it, or **Alt + Home** to reset. Positions are temporary workspace state; a newly opened dialog starts in its default position.

## Global search and printable biographies

The search bar at the top of every workspace searches all stored values, including optional sections hidden in the current view. Results include people, sources, relationships, property and family groups. Source transcriptions and metadata are searchable; binary attachments are not automatically transcribed or indexed. Linked source and relationship context can also match a person.

Combine terms with spaces (all must match), quote a phrase, use `|` between alternatives, and prefix an excluded term with `-`. Optional field filters are `name:`, `gender:`, `document:`, `country:` and `type:`. Ukrainian and Russian aliases work too, including `ім’я:`, `прізвище:`, `стать:`, `документ:`, `країна:`, `имя:`, `фамилия:`, `пол:` and `страна:`. Name filters include recorded former names and surnames. Gender filters match the stored basic gender exactly; they do not infer it from identity history.

Examples:

```text
name:Robin gender:male Guitar
name:Jesse document:DEMO 62.5
country:"Sample Republic" | country:Exampleland
прізвище:Avery стать:небінарна
name:Doe -document:expired
```

Press **Ctrl/Cmd + K** to focus search, use arrow keys and Enter to open a result, or Escape to close results. Workspace visibility and family-group filters do not restrict global search.

Open a person's **Autobiography**, then choose **Print / Save as PDF**. In the browser print dialog select a printer or **Save as PDF**. The A4 report includes all populated sections, relationship details, property and linked source metadata, with no workspace controls. It uses the selected interface language. File attachments remain in the editable ZIP backup; the report includes their references rather than embedding their contents. Cancelling or finishing print returns to the unchanged on-screen profile.

## Using the map on a phone

- Drag anywhere on the map, including a card, to pan. Pinch with two fingers to zoom; tap a person to open the bottom sheet.
- Use the person focus button to center the selected person at a readable scale. The fit button shows the entire map.
- Enable **Move cards** to rearrange person cards with one finger. Turn it off to resume panning over cards. Movement supports undo/redo; cancelled gestures restore the card position.
- Expand **Map tools** for layouts, filters, connection search and other map settings. Open the navigation menu for people, sources and other workspace views.

## Local development

Use Node.js 22 or newer for development tools:

```sh
npm ci
npm run dev
```

The local preview is available at `http://localhost:8080`. Use `PORT` to change the preview port. The preview script only serves static files; it is not part of the deployed application.

Opening `index.html` directly through `file://` is unsupported because browsers restrict ES module loading. Serve the project through HTTP locally or HTTPS on GitHub Pages.

```sh
npm run lint          # Binding and code-quality checks
npm run check:syntax  # JavaScript syntax checks
npm test              # Model, validation, date and graph tests
npm run build         # Create the deployable dist/ directory
npm run check         # Run all of the above
npm run preview       # Serve dist/ after building
```

Browser integration checks require Chromium:

```sh
npx playwright install chromium
npm run test:browser
```

Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to select an existing Chromium executable. Set `JURISTREE_BASE_URL` to test another static deployment, including a project subdirectory.

## GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. Open **Settings → Pages** and choose **GitHub Actions** as the build source.
3. The included `.github/workflows/pages.yml` validates the project, builds static files and publishes `dist/` after pushes to `main`. It can also be started manually.

The build copies the entire browser module graph and public assets to `assets/<content-hash>/`, rewrites the HTML entry points, and adds `.nojekyll`. Native relative imports are preserved; there is no bundling or transpilation. Changed code receives a new asset directory, preventing browser or CDN caches from combining modules from different releases, including CDNs that ignore query strings. Keep the HTML entry point uncached or revalidated in any additional CDN configuration. Asset URLs remain relative, so both a domain root and a URL such as `https://example.github.io/JurisTree/` work without a base-path configuration.

The repository's `CNAME` file configures `juristree.global.agency` and is included in the deployment artifact. Set the same custom domain in **Settings → Pages** and enable HTTPS when its certificate is ready. To use the default GitHub Pages address, remove `CNAME` and clear the custom domain in those settings.

To use another static host, upload the contents of `dist/` while preserving its directory structure. No server rewrite rules or environment secrets are required.

## Architecture

```text
index.html                 Static document and relative asset entry points
src/
  main.js                  Mounting, language changes and application startup
  app/
    bootstrap.js           Draft initialization
    actions.js             Named UI actions
    events.js              Event registration
    events/                Click, change, input, keyboard and upload handlers
  core/
    state.js               Shared runtime state and history collections
    config.js              Record types, profile sections and display settings
    profile-sections/      Independent extended profile definitions and field groups
    viewport.js            Shared mobile layout breakpoint
    dom.js                 DOM queries and HTML escaping
    utils.js               IDs, cloning, formatting, URLs and downloads
  model/                   Project selectors, validation, dates, evidence and kinship
  features/                People, favorites, calendar, search, printing, documents, groups, events, property and launcher flows
  graph/                   Rendering, camera, mouse/touch interaction, layouts and analysis
  services/                IndexedDB saving, history, files, archives and browser tools
  ui/
    shell.js               Shell mounting and static translation bindings
    templates/             Readable launch, workspace and dialog markup
    components.js          Shared HTML components
    forms/                 Individual dialog and form components
    profile-fields.js      Shared structured field display for profiles and biographies
    dialog.js              Dialog lifecycle and notifications
    floating-windows.js    Shared mouse, touch and keyboard window positioning
    cropper.js             Client-side image preparation
    icons.js               One immutable collection of SVG icon paths
  i18n/
    index.js               Language preference and message lookup
    locales/               Matching English, Ukrainian and Russian message catalogs
  styles/                  Base, workspace, graph, forms and feature stylesheets
  vendor/                  Local JSZip distribution and its module entry point
scripts/                   Development preview, syntax validation and static build
tests/                    Unit and browser integration tests
```

Runtime state is explicitly imported as `appState`; application features do not attach their own state to `window`. Persisted project data is separate from temporary selections, filters, dialogs, camera state and undo history.

Domain operations read the project through model selectors. UI edits go through `commit()` in `services/history.js`, which records undo history, updates the timestamp, renders and schedules persistence. Graph rendering uses a temporary project index to avoid repeated full-array searches.

Forms are separate components from the operations that validate and save them. Profile sections use the record configuration in `core/config.js` for fields, rendering, collection and import validation.

The optional browser `document.modelContext` integration is isolated in `services/browser-tools.js`. The application also works when this browser API is absent.

## Adding functionality

### A new action or feature

1. Implement the feature under `src/features/` and reusable form markup under `src/ui/forms/`.
2. Add a named handler in `app/actions.js` and use `data-action` on its control. Add specialized event handling in the appropriate `app/events/` module when needed.
3. Modify project data through `commit()` so undo/redo and saving stay consistent.
4. Extend `model/validation.js` when the persisted model changes.
5. Add relevant messages to all three locale catalogs and cover meaningful data or interaction behavior with tests.

### A new profile section

Create a module in `src/core/profile-sections/` using `defineSection()` and register it in that directory's `index.js`. A definition owns its persisted array key, title, icon, record label, field groups and date ranges. Its optional `numericMinimums` validates lower bounds. Its optional `calendar: { type, dates: [[field, messageKey]] }` declares dates for the shared event collector; new modules can contribute dates without modifying the collector. Field types include text, textarea, select, person reference, source, exact date, partial period, year and number. Person references resolve to names and are cleared if the referenced person is removed. Unlabelled groups show immediately; labelled groups become expandable details.

The registry feeds the editor, collection, import validation, source cleanup, workspace scope picker and complete autobiography. Add translations in all three catalogs and tests for meaningful validation or persistence behavior. Choose initial visibility in `defaultScopes` only when the section should appear in that workspace by default; otherwise it is accessible through **Add more information**. Core profile sections remain defined in `core/config.js`.

### Translations

Import `translate` from `i18n/index.js` and use a stable, descriptive key:

```js
translate("ui.save");
```

All catalogs must contain the same keys. Missing messages fail explicitly instead of silently mixing languages. `getLocale()` supplies the active locale for sorting and date formatting. Ukrainian uses the standard locale code `uk` internally and the requested **UA** label in the interface.

Translate interface messages before inserting user data. Names, notes, source titles and imported content are never machine-translated. Language selection is stored separately from project data; changing it re-renders the interface without replacing the project.

Write documentation and code comments in English.

## Data and backups

The current draft and its attachments are stored together in IndexedDB under `juristree-draft-v1`. The interface language is stored in localStorage. A saved draft belongs to that browser profile and origin; it does not sync between devices. Browser storage availability and capacity depend on the browser.

Export ZIP for a portable, editable backup. An archive contains:

```text
tree.json                  Complete project data and attachment manifest
attachments/<id>.<ext>     Attached binary files
README.txt                 English archive instructions
```

The canonical archive model is `format: "juristree", version: 1`. This implementation accepts JurisTree archives and JSON with that schema; it does not include a migration adapter for the original prototype's `rodovid` format. JSON describes the model but cannot restore binary files on its own. PNG and SVG are image exports, not editable backups.

Images are cropped and compressed locally; their untouched originals remain outside the application. PDFs, TXT, DOCX, audio and video attachments retain their original bytes. DOCX contents are not parsed. External source links support HTTP and HTTPS only.

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

These are import and attachment limits. Large projects can still be constrained by browser memory, storage and canvas export dimensions. Use SVG for oversized diagrams.

## Scope

Evidence labels and property shares reflect user-entered information. Kinship calculations describe recorded relationships. JurisTree does not determine legal inheritance rights or automatically produce jurisdiction-specific legal requirements.

GEDCOM, draw.io and IBM i2 files are not supported. There is no collaborative editing, cloud synchronization or automatic backup outside the browser.

See `THIRD_PARTY_NOTICES.md` for the licenses of locally included JSZip and icon assets.
