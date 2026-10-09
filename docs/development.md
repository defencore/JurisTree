# Development guide

The in-app walkthrough uses `src/core/user-guide.js` for its lesson sequence, `src/ui/user-guide.js` for rendering and navigation, and `src/features/user-guide.js` for opening and downloading. `src/data/guide-example.js` supplies the displayed example and downloadable project from the same people, relationship and group definitions. Keep the English [first-map tutorial](getting-started.md) aligned with these definitions when changing the exercise.

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

The logo and browser favicon share `public/juristree-icon.svg`. The shared header markup resolves the asset relative to its module so it works at both domain roots and GitHub Pages project paths.

The repository's `CNAME` file configures `juristree.global.agency` and is included in the deployment artifact. Set the same custom domain in **Settings → Pages** and enable HTTPS when its certificate is ready. To use the default GitHub Pages address, remove `CNAME` and clear the custom domain in those settings.

To use another static host, upload the contents of `dist/` while preserving its directory structure. No server rewrite rules or environment secrets are required.

## Diagram editing

`model/diagram.js` owns route validation, bounded coordinates, alignment and snapping. `model/connector-path.js` calculates card ports and manual polyline/orthogonal paths. `project.diagram` stores routes by relationship, source-person, property-allocation or group-caption key; it contains no profile facts. `model/map-views.js` captures an independent copy of routes and display settings. Missing or deleted connections are discarded during import and view restoration.

`features/diagram.js` coordinates editing actions and history. `graph/diagram-interaction.js` captures mouse, pen, touch and keyboard gestures on the stable SVG root, previews mutations, and commits one history entry on completion. Cancellation restores the preceding project. `graph/diagram-markup.js` owns caption plates and editing handles; `ui/diagram-tools.js` renders progressive controls. Diagram bounds include waypoints and captions. Export rendering suppresses handles, grid and temporary selection strokes.

Portrait selection math lives in `model/crop-geometry.js`; `ui/cropper.js` owns gestures, preview and encoding. Portrait frames can extend beyond the image for reduction with white padding; document crops remain within the page. Group colors accept validated six-digit hex values from the native color picker.

## Architecture

Person creation uses `core/person-creation.js` for roles, `model/person-creation.js` for form collection and batch validation, and `features/person-creation.js` for one atomic project/history update. `ui/forms/person-links.js` owns progressive relationship rows. `model/relationship-draft.js` supplies ordered selection defaults and shared validation for both creation batches and the standalone editor. Placement calculations live in `model/person-placement.js`, with the current graph viewport and obstacles supplied by `graph/person-placement.js`. Adding a person never moves existing cards or fits the entire graph.

`model/person-selection.js` owns locale-aware surname ordering and token-based name matching, including aliases and name history. It prefers a structured surname linked to the displayed name (or a current legal-name record without a full name); otherwise it uses the last word of the basic given-name–surname field. Record the full name and surname together in **Names and surnames** for other naming orders or compound surnames. The shared `ui/person-picker.js` adds searches to native person selects and group checkboxes. Select values remain unchanged during filtering, and checked members stay in the form even when hidden. Call `bindPersonPickers(root)` after rendering new rows; binding is idempotent. Searching does not change project data or history.

`model/person-display.js` supplies display names and lifespan summaries for cards, profiles, selectors and reports. Explicit maiden records append a parenthesized surname without modifying the basic current name or its sorting key. Prefer structured surname fields; full-name-only records can reuse unchanged name components to isolate the former surname. `model/dates.js` computes completed-year age bounds from exact or partial dates, while `model/person-status.js` resolves the life status and age reference date. Living ages use today; deceased ages use the death date and remain fixed. Missing dates yield no age, partial dates yield a range and unknown life status does not imply a current age. Search summaries invalidate their cache when the local date changes.

```text
index.html                 Static document and relative asset entry points
src/
  main.js                  Mounting, language changes and application startup
  app/
    bootstrap.js           Draft initialization
    runtime.js             Application effects for project and storage signals
    browser-tools.js       Optional browser modelContext integration
    actions.js             Named UI actions
    events.js              Event registration
    events/                Click, change, input, keyboard and upload handlers
  core/
    state.js               Shared runtime state and history collections
    config.js              Record types, profile sections and display settings
    property-records.js     Ledger fields, progressive groups and validation rules
    profile-groups.js      Shared ordered information hierarchy
    profile-catalog.js     Searchable section and field metadata
    workspace-views.js     Canonical navigation and view heading registry
    workspace-modes.js     Mode definitions, templates and compact section defaults
    signals.js             Explicit application effect subscriptions
    graph-view.js          Graph settings defaults and normalization
    event-domains.js       Date categories, recurrence and celebration rules
    person-filter-fields.js Filter field, operator and query validation registry
    profile-sections/      Independent extended profile definitions and field groups
    professional-relationships.js Professional fields and connection direction rules
    theme.js               Shared interface and SVG color tokens
    viewport.js            Shared mobile layout breakpoint
    dom.js                 DOM queries and HTML escaping
    utils.js               IDs, cloning, formatting, URLs and downloads
  model/                   Data queries, validation and calculations; no UI imports
    lookup.js              Runtime project entity lookup without rendering dependencies
    project.js             Fresh projects, scoped records and temporary query index
    profile-form.js        Complete form data collection
    profile-references.js  Person/source/relationship labels and reference lifecycle
    profile-scope.js       Compact workspace visibility preferences
    person-filter-state.js Shared cached analytical query results
    graph-view.js          Visibility and runtime analysis state
    map-views.js           Named placement snapshots, validation and responsive camera restoration
    graph-analysis.js      Paths, neighborhoods and connection calculations
    workspace.js           Current or saved draft selection
    property-history.js    Dated rights, open claims and evidence consistency checks
    property-records.js    Canonical ledger validation and reference lifecycle
    property-events.js     One-time financial dates from the property ledger
    kinship-index.js       Scoped family adjacency and shared ancestry calculations
    biography-review.js    Pure interval coverage, gap detection and clarification lists
    profile-migrations.js  One-time normalization of earlier mixed profile history
    profile-activities.js  One-time consolidation of former activity summaries and section keys
    person-filters.js      Query evaluation, conservative comparisons and CSV export
    person-filter-facts.js Shared analytical facts, dates, source and family counts
    person-filter-assets.js Dated inventory observations and currency/share totals
    contacts.js            Safe phone, email and social contact links
  features/                Controllers for user workflows; import UI and model modules
    profile-workspace.js   Complete profile navigation
    workspace-session.js   Project activation and draft replacement
    attachments.js         Batched source uploads, downloads and cropped copies
    portrait.js            File/clipboard portrait workflow
    source-attachment-editor.js  Staged multi-file source editing
    document-view.js       Source metadata and attachment gallery
    archive.js             Archive and diagram import/export workflows
    delete.js              Entity deletion and reference cleanup
    graph-analysis.js      Apply analysis, visibility presets and selection commands
    graph-tools.js         Graph help, filter and analysis dialog workflows
  graph/
    render.js              Graph composition and SVG definitions
    nodes.js               SVG node rendering and non-person cards
    node-data.js           Visible node data for camera, rendering and exports
    cards/person.js        Person-card content, status badges, dates and actions
    edges.js               Relationship, source and property lines
    geometry.js            Connection paths
    text.js                Measured SVG text wrapping and pills
    roles.js               Cached selection-relative family roles and card colors
    role-legend.js         Selected-person context and family color key
    layouts/               Pure family, circle and network algorithms
    layout.js              Layout actions, history and camera orchestration
    camera.js              Zoom and positioning
    interaction.js         Mouse interaction
    touch.js               Touch gestures
  services/                UI-independent browser persistence and history
    blobs.js               Attachment object URLs, references and lifetime
    history.js             Project commits, undo/redo and selection repair
    storage.js             Serialized IndexedDB writes and storage signals
  ui/
    shell.js               Shell mounting and static translation bindings
    templates/             Readable launch, workspace and dialog markup
    render.js              Workspace render orchestration and selection
    people.js              Compact map people list
    workspaces/            Profiles, calendar, chronology, documents, gaps and property
    profile-navigation.js  Shared section search and navigation without form reconstruction
    profile-details.js     Structured complete and compact profile display
    favorites.js           Favorite controls and quick-access rendering
    groups.js              Family connections and group navigation
    search.js              Global search results and cached index
    start.js               Launch screen rendering
    graph-controls.js      Graph toolbar rendering
    inspector.js           Person and relationship panel
    status-board.js        Workspace document counters
    save-status.js         Save phase display in the current interface language
    person-status.js       Shared translated life and age badges
    components.js          Shared HTML components
    forms/                 Individual dialog and form components
    property-workspace.js  Search, dated snapshots and allocation planning
    property-history.js    Rights, transfers, claims and complete report rendering
    profile-fields.js      Shared structured field display for profiles and biographies
    biography-review.js    Review controls and translated report rendering
    event-domains.js       Category selection and contextual record actions
    event-list.js          Chronology controls and date filters
    dialog.js              Dialog lifecycle and notifications
    floating-windows.js    Shared mouse, touch and keyboard window positioning
    cropper.js             Client-side image preparation
    icons.js               One immutable collection of SVG icon paths
  i18n/
    index.js               Language preference and message lookup
    locales/               Matching English, Ukrainian and Russian message catalogs
  data/
    demo.js                Fresh demo composition and initial generation layout
    demo-people.js         Core people, surname timelines and relationship episodes
    families/              Curated ancestor, cousin and partner households; builder and profiles
    records.js             Person, source and former-name record factories
    demo-records.js         Detailed core profile and property records
    demo-details.js         Residence, appearance, health, skills, travel and citizenship
    demo-life-records.js    Attributed life events, service, testimony and contacts
    demo-business-records.js Assets, restrictions, accounts, companies and organizational links
    demo-property-history.js Dated land ownership, gifts and competing family claims
    demo-sources.js         Core evidence references and review states
    demo-civil-records.js   Civil records linked to participants, sources and relationships
  styles/                  Base, workspace, graph, forms and feature stylesheets
  vendor/                  Local JSZip distribution and its module entry point
scripts/                   Development preview, syntax validation and static build
tests/                    Unit and browser integration tests
```

Runtime state is explicitly imported as `appState`; application features do not attach their own state to `window`. Persisted project data is separate from temporary selections, filters, dialogs, camera state and undo history.

Domain operations read the project through model selectors. UI edits go through `commit()` in `services/history.js`, which records undo history, updates the timestamp and publishes `project:changed`. `app/runtime.js` connects that signal to rendering and persistence. Storage reports status and errors through the same explicit signal mechanism; it does not import the UI. Graph rendering uses a temporary project index to avoid repeated full-array searches.

Module imports are acyclic. Core, model and storage modules never import UI, graph rendering or feature controllers; UI never imports feature controllers. `tests/architecture.test.js` enforces these boundaries and verifies all relative imports exist. Rendering and controller functions have separate canonical modules, without forwarding aliases.

Forms are separate components from the operations that validate and save them. Profile sections use the record configuration in `core/config.js` for fields, rendering, collection and import validation.

`model/dates.js` owns date validation and display. Complete dates use `DD.MM.YYYY` in every language; known years retain their precision. `ui/date-input.js` provides the shared text field and native calendar picker, converting named fields to canonical `YYYY-MM-DD` values at the `formdata` boundary. Archive data, chronological comparisons and calculations continue to use canonical dates. Use this component for new exact-date or period fields; controllers reading fields directly must call `dateInputValue()` before validation or storage. Relationship titles and periods render on separate lines, with additional spacing between episodes connecting the same people.

The optional browser `document.modelContext` integration is isolated in `app/browser-tools.js`. The application also works when this browser API is absent.

## Adding functionality

### A new action or feature

1. Implement the feature under `src/features/` and reusable form markup under `src/ui/forms/`.
2. Add a named handler in `app/actions.js` and use `data-action` on its control. Add specialized event handling in the appropriate `app/events/` module when needed.
3. Modify project data through `commit()` so undo/redo and saving stay consistent.
4. Extend `model/validation.js` when the persisted model changes.
5. Add relevant messages to all three locale catalogs and cover meaningful data or interaction behavior with tests.

### A new profile section

Create a module in `src/core/profile-sections/` using `defineSection()` and register it in that directory's `index.js`. A definition owns its persisted array key, title, icon, record label, field groups and date ranges. Its optional `numericMinimums` and `numericMaximums` validate lower and upper bounds and set matching form constraints. Its optional `calendar: { type, dates: [[field, messageKey]] }` declares dates for the shared event collector; optional `titleFields` selects record fields for date-entry titles; new modules can contribute dates without modifying the collector. Its optional `coverage: { from, to, current: { field: [values] }, kinds }` declares continuous periods for biography review. Its optional `validate(record)` supplies section-specific validation. Field types include text, textarea, select, person reference, relationship reference, source, HTTP/HTTPS URL, exact date, partial period, year and number. Person and relationship references resolve to descriptive names. `model/profile-references.js` clears dangling person, relationship and source references on import or deletion while preserving original text. Unlabelled groups show immediately; labelled groups become expandable details.

Register the section in the ordered hierarchy in `core/profile-groups.js`. For calendar dates, add its event type to `familyEventTypes()` and assign a category in `core/event-domains.js`. The registry feeds the editor, collection, import validation, source cleanup, workspace scope picker and complete autobiography. Add translations in all three catalogs and tests for meaningful validation or persistence behavior. Choose initial visibility in `core/workspace-modes.js` only when the section should appear in that workspace by default; every section is always available through the complete editor and profile catalog. Core profile sections remain defined in `core/config.js`.

### A new workspace mode

Add a canonical definition to `core/workspace-modes.js` with its section defaults, icon, optional initial view/layout and relevant graph flags. Add title, project name and description messages in every locale. Launch templates, sidebar options and source visibility controls derive from this registry. Empty source `purposes` means unrestricted visibility, including future modes; explicit subsets restrict visibility. Project `modeVisibilityVersion: 2` distinguishes explicit subsets from the former four-mode default. Import upgrades that old default only when the marker is absent; current archives retain explicitly selected subsets. Keep import normalization at the archive boundary.

### Translations

Import `translate` from `i18n/index.js` and use a stable, descriptive key:

```js
translate("ui.save");
```

All catalogs must contain the same keys. Missing messages fail explicitly instead of silently mixing languages. `getLocale()` supplies the active locale for sorting, month names and plural rules. Complete numeric dates keep the common `DD.MM.YYYY` format. Ukrainian uses the standard locale code `uk` internally and the requested **UA** label in the interface.

Translate interface messages before inserting user data. Names, notes, source titles and imported content are never machine-translated. Language selection is stored separately from project data; changing it re-renders the interface without replacing the project.

Write documentation and code comments in English.

Source records use `attachments: [{ assetId, filename, caption, mime, size }]`. Binary files live in the shared blob store and ZIP attachment manifest. Import normalization converts older single-file records once; runtime consumers use only the attachment list. Source edits stage binary additions and removals until Save. Clipboard reads are initiated by a user action; paste events provide images without reading unrelated clipboard text. Originals are stored unchanged and cropping creates an additional file.

Profile record attachments reuse the source model: `sourceId` links the saved record to its source, which can contain several photos/files. Sources link back to profile records by deriving these references, avoiding duplicate attachment ownership. Book/publication metadata (`collectionTitle`, `volume`, `pages`) and per-file captions remain optional.

Direct-connection highlighting is a runtime overlay in `model/graph-view.js`, using the one-hop scope from `model/direct-connections.js`. It preserves display filters, prior analysis and stored group collapse states. `features/direct-connections.js` handles highlighting/clearing without fitting the camera, and `graph/layouts/scoped.js` translates partial layouts to avoid other cards without changing their coordinates. The reference person stays fixed while selecting or moving visible neighbors; project edits refresh the scope. Full-diagram exports bypass the overlay.

Group collapse controls use `groupIsCollapsed()` for effective visibility, including temporary analysis expansion. Bulk changes commit once and preserve person coordinates. Group layouts use the same scoped positioning as direct-connection layouts. Crop geometry is isolated in `model/crop-geometry.js`; `ui/cropper.js` applies pointer capture, corner resizing, keyboard movement and portrait scaling. The preview includes out-of-image crop areas, which export with a white fill. Document crops stay inside the original image.
