# JurisTree

[JurisTree](https://juristree.global.agency/) organizes people, relationships, documents and property history in one browser workspace. The interface supports **EN / UA / RU**. It runs entirely on the client and can be hosted on GitHub Pages.

## Getting started

Create a project, import a JurisTree ZIP/JSON file, resume your browser draft or open the fictional demonstration.

Use the book button beside the language selector for an in-app walkthrough in EN / UA / RU, including a downloadable three-generation example. The [first-map tutorial](docs/getting-started.md) explains the same exercise in English.

1. Choose a workspace mode and add people.
2. Open **People & profiles** to complete a profile. Find sections by name, field or category; only the person's name is required.
3. Add relationships while creating a person, or Ctrl / ⌘ + click two people and choose **Add relationship**. Attach sources and record dates and verification where needed.
4. Use the map, search, filters, calendar and property history to investigate the recorded information.
5. Export ZIP for an editable backup. Open an autobiography to print or save as PDF.

## Workspace modes

| Mode                 | Focus                                                         |
| -------------------- | ------------------------------------------------------------- |
| Family and genealogy | Family tree, generations and family history                   |
| Civil status         | Act records, certificates, extracts and registered names      |
| Inheritance cases    | Family paths, documents, rights and competing claims          |
| Property and rights  | Ownership, use, gifts, sales and encumbrances                 |
| Connection research  | Personal/professional connections and evidence gaps           |
| Profiling            | Complete profiles, life histories and attributed observations |
| Legal cases          | Proceedings, decisions, custody periods and witnesses         |
| Finances and assets  | Income, accounts, companies, assets and liabilities           |

Modes suggest visible sections and a starting view. Switching modes preserves all data. Complete profiles remain available in every mode; **Choose visible data** customizes the compact panel.

## Main tools

- Interactive relationship map with family roles, saved arrangements, layouts, connection analysis and touch navigation.
- Optional profile sections for identity, civil status, education, employment, residence, travel, health, interests, finances and other records.
- Sources with attachments, original text, citations, verification and configurable document checklists.
- Combined search and advanced filters, saved queries and CSV export.
- Separate family celebrations, life history, legal and financial dates, with month/year calendars.
- Property history with dated rights, transfers and competing claims.
- Favorites, undo/redo, draggable dialogs, complete biographies and PDF printing.

Civil records distinguish the act, its participants, issued documents and later annotations, following the structure of the [Ukrainian civil registry instruction](https://zakon.rada.gov.ua/laws/show/z0691-08#Text). Records link to people, relationships and sources without automatically changing names or ancestry.

## Local development

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open `http://localhost:8080`. The preview serves static files; the deployed app needs no backend.

```sh
npm run check                   # Lint, syntax, unit tests and production build
npx playwright install chromium
npm run test:browser             # Browser interaction checks
npm run preview                 # Serve the built dist/ directory
```

## Deployment

Enable **GitHub Actions** in the repository's Pages settings and push to `main`. The included workflow checks the app and deploys `dist/`. Relative assets support both domain roots and GitHub Pages project paths. `CNAME` configures `juristree.global.agency`.

## Data and documentation

Drafts and attachments are stored in this browser's IndexedDB. ZIP exports include the project and attached files; JSON contains data only. PNG/SVG exports are diagram images. There are no accounts, cloud synchronization or registry integrations. Findings describe entered records and evidence, rather than determining legal rights.

- [User guide](docs/user-guide.md): profile fields, civil records, relationships, search, mobile use and backups.
- [Development guide](docs/development.md): architecture, modules, extensions and deployment details.
- [Third-party notices](THIRD_PARTY_NOTICES.md): licenses for bundled assets.

Documentation and code comments are written in English.
