import { brandMark } from "../brand.js";
import { languageControl } from "./language.js";

export const startTemplate = `
<section
  class="start-screen"
  id="startScreen"
  aria-label="@@ui.openOrCreateAMap@@"
>
  <header class="start-topbar">
    <div class="brand">
      ${brandMark}
      <div>
        <b>JurisTree</b><small>@@ui.peopleDocumentsRelationships@@</small>
      </div>
    </div>
<button class="btn start-help" type="button" data-action="coverage">
      <i data-icon="help"></i><span>@@ui.capabilitiesAndLimits@@</span>
    </button>
    <div class="header-preferences">${languageControl}</div>
  </header>
  <main class="start-main">
    <div class="start-heading">
      <p class="eyebrow">@@ui.yourWorkspace@@</p>
      <h1 id="startHeading" tabindex="-1">@@ui.openOrCreateAMap2@@</h1>
      <p>@@ui.chooseATemplateOpenASavedFileOr@@</p>
    </div>
    <section class="start-resume" id="startResume" hidden>
      <span class="resume-icon"><i data-icon="history"></i></span>
      <div>
        <p class="section-label">@@ui.continueWorking@@</p>
        <h2 id="startDraftTitle"></h2>
        <p id="startDraftSummary"></p>
        <small id="startDraftDate"></small>
      </div>
      <button
        class="btn primary"
        id="startContinue"
        type="button"
        data-action="start-continue"
        disabled
      >
        @@ui.openDraft@@<i data-icon="arrowRight"></i>
      </button>
    </section>
    <div class="start-columns">
      <form class="start-panel start-create" id="startForm">
        <div class="start-panel-heading">
          <span class="start-number">1</span>
          <div>
            <h2>@@ui.newMap@@</h2>
            <p>@@ui.theTemplateSetsUpSectionsAndYourWorkflow@@</p>
          </div>
        </div>
        <label class="field start-title-field"
          >@@ui.mapTitle@@<input
            id="startTitle"
            value="@@ui.myFamily@@"
            maxlength="150"
            required
            autocomplete="off"
        /></label>
        <p class="field-caption">@@ui.chooseATemplate@@</p>
        <div
          class="start-template-grid"
          id="startTemplateGrid"
          aria-label="@@ui.mapTemplates@@"
        >
          <p class="hint">@@ui.loadingTemplates@@</p>
        </div>
        <div class="start-template-detail">
          <i data-icon="info"></i>
          <p id="startTemplateDetail"></p>
        </div>
        <div class="start-create-foot">
          <small>@@ui.noDemonstrationRecords@@</small
          ><button class="btn primary" id="startCreate" type="submit" disabled>
            <i data-icon="plus"></i>@@ui.createMap@@
          </button>
        </div>
      </form>
      <div class="start-open-column">
        <section class="start-panel">
          <div class="start-panel-heading">
            <span class="start-number">2</span>
            <div>
              <h2>@@ui.openYourFile@@</h2>
              <p>@@ui.continueWorkingOnYourTree@@</p>
            </div>
          </div>
          <div class="start-drop" id="startDrop">
            <span class="start-file-icon"><i data-icon="upload"></i></span
            ><b>@@ui.dropAFileHere@@</b>
            <p>@@ui.juristreeZipArchiveOrJson@@</p>
            <button
              type="button"
              class="btn"
              id="startImport"
              data-action="start-import"
              disabled
            >
              <i data-icon="folder"></i>@@ui.chooseFile@@
            </button>
          </div>
          <div class="start-file-notes">
            <p><b>ZIP</b><span>@@ui.treeWithDocumentsAndPhotographs@@</span></p>
            <p>
              <b>JSON</b><span>@@ui.mapDescriptionWithoutAttachments@@</span>
            </p>
          </div>
          <p class="hint start-formats">
            @@ui.filesFromOtherEditorsIncludingDrawIoAnd@@
          </p>
        </section>
        <section class="start-panel start-demo">
          <span class="demo-preview" aria-hidden="true"
            ><i data-icon="network"></i
          ></span>
          <div>
            <p class="section-label">@@ui.explore@@</p>
            <h2>@@ui.demonstrationMap@@</h2>
            <p>@@ui.largeFamilyDemoDescription@@</p>
            <button
              class="btn"
              id="startDemo"
              type="button"
              data-action="start-demo"
              disabled
            >
              @@ui.openDemo@@<i data-icon="arrowRight"></i>
            </button>
          </div>
        </section>
      </div>
    </div>
    <p class="start-error" id="startError" role="alert"></p>
    <footer class="start-footer">
      <i data-icon="shield"></i>
      <p id="startStorageNote" role="status" aria-live="polite">
        @@ui.checkingSavedWork@@
      </p>
      <button type="button" data-action="coverage">
        @@ui.whichDataIsSupported@@
      </button>
    </footer>
  </main>
</section>
`;
