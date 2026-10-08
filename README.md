# JurisTree

JurisTree is a multilingual workspace for family relationships, personal profiles, documents, evidence, events and property planning. It runs entirely in the browser and can be hosted on GitHub Pages.

The application uses native JavaScript ES modules and plain CSS. It has no backend, accounts, remote database, production Node.js runtime or CDN dependency. JSZip and SVG icons are included locally.

## Features

- Family, inheritance, property, research and blank project templates.
- People, family groups and six relationship types, including adoption and acquaintance.
- Interactive SVG map with dragging, zoom, multiple selection, filters and generation, circle or network layouts.
- Shortest and alternative paths, neighborhoods, common connections and connecting networks.
- Kinship descriptions based on recorded relationships.
- Document references, digital attachments, evidence states and configurable checklists.
- Profiles with contacts, residence history, biographies, work, education, interests, health information and pets.
- Upcoming anniversaries and a historical timeline, including partial dates and leap-day handling.
- Property records with manually entered allocation shares.
- Undo/redo, browser draft storage, portable ZIP archives and PNG/SVG image export.
- English, Ukrainian and Russian interfaces, displayed as **EN / UA / RU**.

Demo records are fictional. The launch screen opens before any demo is loaded or existing draft is replaced.

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

The build copies browser assets and adds `.nojekyll`; it does not bundle or transpile the application. Asset URLs and module imports are relative, so both a domain root and a URL such as `https://example.github.io/JurisTree/` work without a base-path configuration.

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
    dom.js                 DOM queries and HTML escaping
    utils.js               IDs, cloning, formatting, URLs and downloads
  model/                   Project selectors, validation, dates, evidence and kinship
  features/                People, documents, groups, events, property and launcher flows
  graph/                   Rendering, camera, interaction, layouts, analysis and legends
  services/                IndexedDB saving, history, files, archives and browser tools
  ui/
    shell.js               Shell mounting and static translation bindings
    templates/             Readable launch, workspace and dialog markup
    components.js          Shared HTML components
    forms/                 Individual dialog and form components
    dialog.js              Dialog lifecycle and notifications
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

Add the section metadata and field configuration to `sectionInfo()` and `recordConfigs()` in `core/config.js`, then choose the purposes that show it in `defaultScopes`. Existing profile editors and imported record validation use these definitions. Add custom presentation or validation if the section needs behavior beyond configured fields.

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

Images are cropped and compressed locally; their untouched originals remain outside the application. PDFs, TXT and DOCX attachments are retained as files. DOCX contents are not parsed. External source links support HTTP and HTTPS only.

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

These are import and attachment limits. Large projects can still be constrained by browser memory, storage and canvas export dimensions. Use SVG for oversized diagrams.

## Scope

Evidence labels and property shares reflect user-entered information. Kinship calculations describe recorded relationships. JurisTree does not determine legal inheritance rights or automatically produce jurisdiction-specific legal requirements.

GEDCOM, draw.io and IBM i2 files are not supported. There is no collaborative editing, cloud synchronization or automatic backup outside the browser.

See `THIRD_PARTY_NOTICES.md` for the licenses of locally included JSZip and icon assets.
