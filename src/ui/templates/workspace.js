import { brandMark } from "../brand.js";
import { languageControl } from "./language.js";
import { workspaceNavigation } from "./navigation.js";

export const workspaceTemplate = `
<div id="appShell" hidden>
  <header class="topbar">
    <button
      class="iconbtn menu-toggle"
      data-action="menu"
      aria-label="@@ui.openNavigation@@"
    >
      <i data-icon="menu"></i>
    </button>
    <div class="brand">
      ${brandMark}
      <div>
        <b>JurisTree</b><small>@@ui.peopleDocumentsRelationships@@</small>
      </div>
    </div>
    <div class="project-title">
      <button data-action="project" id="projectTitle">@@ui.myFamily@@</button
      ><span class="demo-tag" id="demoTag">@@ui.demo@@</span>
    </div>
    <div class="top-actions">
<button
        class="iconbtn start-home"
        data-action="start"
        aria-label="@@ui.homeScreen@@"
        title="@@ui.templatesDemoAndFileImport@@"
      >
        <i data-icon="layout"></i></button
      ><span
        class="save-state"
        id="saveState"
        title="@@ui.draftIsSavedOnlyInThisBrowser@@"
      ></span
      ><button class="btn" data-action="import" aria-label="@@ui.import2@@" title="@@ui.import2@@">
        <i data-icon="upload"></i><span>@@ui.import2@@</span></button
      ><button class="btn primary" data-action="export" aria-label="@@ui.exportTree@@" title="@@ui.exportTree@@">
        <i data-icon="download"></i><span>@@ui.exportTree@@</span>
      </button>
    </div>
    <div class="header-preferences"><button type="button" class="iconbtn workspace-guide-button" data-action="user-guide" aria-label="@@ui.userGuideTitle@@" title="@@ui.userGuideTitle@@"><i data-icon="book"></i></button>${languageControl}</div>
  </header>
  <section class="global-search-bar" aria-label="@@ui.globalSearch@@">
    <div class="global-search-input"><i data-icon="search"></i><input id="globalSearch" type="search" autocomplete="off" placeholder="@@ui.globalSearchPlaceholder@@" aria-label="@@ui.globalSearch@@" aria-controls="globalSearchResults" aria-expanded="false"><button type="button" class="iconbtn small" data-action="clear-search" aria-label="@@ui.clearSearch@@"><i data-icon="x"></i></button></div>
    <button type="button" class="btn person-filter-toggle" data-action="person-filters" aria-haspopup="dialog" aria-pressed="false"><i data-icon="sliders"></i><span>@@ui.personFilters@@</span><b id="personFilterCount"></b></button>
    <div id="globalSearchResults" class="global-search-results" role="region" aria-label="@@ui.searchResults@@" hidden></div>
  </section>
  <div class="workspace">
    <aside class="sidebar" id="sidebar">
      ${workspaceNavigation()}
      <div class="purpose">
        <p class="section-label">@@ui.workspaceMode@@</p>
        <select id="purpose" aria-label="@@ui.workspaceMode@@" aria-describedby="purposeHint"></select>
        <p class="hint mode-hint" id="purposeHint"></p><button class="scope-button" data-action="scope">
          <i data-icon="sliders"></i>@@ui.chooseVisibleData@@
        </button>
      </div>
      <section class="favorites-section"><p class="section-label">@@ui.workingPeople@@</p><div id="favoriteList"></div></section>
      <div class="families-section">
        <div class="section-top">
          <p class="section-label" id="groupSectionLabel">
            @@ui.familyGroups@@
          </p>
          <button
            class="iconbtn small"
            data-action="add-group"
            aria-label="@@ui.addPersonGroup@@"
          >
            <i data-icon="groups"></i>
          </button>
        </div>
        <div id="groupList"></div>
      </div>
      <div class="people-section">
        <div class="section-top">
          <p class="section-label">@@ui.people3@@</p>
          <button
            class="iconbtn small"
            data-action="add-person"
            aria-label="@@ui.addPerson@@"
          >
            <i data-icon="addPerson"></i>
          </button>
        </div>
        <div class="search">
          <i data-icon="search"></i
          ><input
            id="peopleSearch"
            placeholder="@@ui.findAPerson@@"
            aria-label="@@ui.searchPeople@@"
          />
        </div>
        <div class="person-list" id="personList"></div>
      </div>
      <div class="sidebar-foot">
        <button class="btn new-tree" data-action="new">
          <i data-icon="plus"></i>@@ui.newTree@@
        </button>
        <div class="local-note">
          <i data-icon="shield"></i
          ><span
            >@@ui.onYourDevice@@<br /><small
              >@@ui.backupZipArchive@@</small
            ></span
          >
        </div>
      </div>
    </aside>
    <main class="main" id="main">
      <div class="viewbar">
        <div>
          <p class="eyebrow" id="viewEyebrow">@@ui.familyRelationships@@</p>
          <h1 id="viewTitle">@@ui.relationshipMap@@</h1>
          <p id="viewSubtitle"></p>
        </div>
        <div class="view-actions" id="viewActions"></div>
      </div>
      <section id="personFilterBar" class="person-filter-bar" aria-live="polite" hidden></section>
      <div id="favoriteRail" class="favorite-rail map-popover" popover="auto"></div>
      <div class="map-settings map-popover" id="mapSettings" popover="auto" aria-label="@@ui.mapOptions@@">
        <div class="map-panel-heading"><b>@@ui.mapOptions@@</b><button class="iconbtn" popovertarget="mapSettings" popovertargetaction="hide" aria-label="@@ui.close@@"><i data-icon="x"></i></button></div>
        <section class="graph-toolbar" id="graphToolbar" aria-label="@@ui.analysisTools@@"></section>
        <details class="map-overview"><summary>@@ui.evidenceAndGaps@@</summary><div class="status-board" id="statusBoard"></div></details>
        <details class="map-inheritance" id="inheritanceSettings"><summary>@@ui.inheritance@@</summary><div id="pathPanel"></div></details>
        <div class="map-touch-tools"><p id="mobileMapHint">@@ui.mobileMapHint@@</p></div>
        <p class="hint map-direction-hint">@@ui.directedRelationshipHint@@</p>
      </div>
      <section
        class="graph-context"
        id="graphContext"
        hidden
        aria-label="@@ui.currentAnalysisResult@@"
      ></section>
      <section class="diagram-tools" id="diagramTools" popover="manual" hidden aria-label="@@ui.diagramEditing@@"></section>
      <div class="canvas-wrap" id="canvasWrap">
        <div class="canvas-top">
          <div class="map-key" id="graphRoleContext" hidden></div>

        </div>
        <svg
          class="graph"
          id="graph"
          role="application"
          aria-label="@@ui.interactiveFamilyRelationshipMap@@"
          tabindex="0"
        >
          <defs id="graphDefs"></defs>
          <g id="scene"></g>
          <rect
            id="selectionBox"
            class="selection-box"
            hidden
            aria-hidden="true"
          ></rect>
        </svg>
        <div class="graph-mobile-actions tool-cluster"><button class="iconbtn" data-action="focus-person" aria-label="@@ui.focusPerson@@" title="@@ui.focusPerson@@"><i data-icon="user"></i></button><button class="iconbtn" data-action="touch-move" aria-label="@@ui.moveCards@@" title="@@ui.moveCards@@" aria-pressed="false"><i data-icon="move"></i></button></div>
        <div class="graph-tools">
          <div class="tool-cluster">
            <button
              class="iconbtn"
              data-action="undo"
              aria-label="@@ui.undo@@"
              title="@@ui.undoCtrlZ@@"
            >
              <i data-icon="undo"></i></button
            ><button
              class="iconbtn"
              data-action="redo"
              aria-label="@@ui.redo@@"
              title="@@ui.redoCtrlShiftZ@@"
            >
              <i data-icon="redo"></i>
            </button>
          </div>
          <div class="tool-cluster">
            <button
              class="iconbtn"
              data-action="zoom-out"
              aria-label="@@ui.zoomOut@@"
            >
              <i data-icon="zoomOut"></i></button
            ><span class="zoom-label" id="zoomLabel">100%</span
            ><button
              class="iconbtn"
              data-action="zoom-in"
              aria-label="@@ui.zoomIn@@"
            >
              <i data-icon="zoomIn"></i></button
            ><button
              class="iconbtn"
              data-action="fit"
              aria-label="@@ui.showEntireTree@@"
              title="@@ui.showEntireTree@@"
            >
              <i data-icon="maximize"></i></button
            >
          </div>
          <div class="tool-cluster">
            <button class="iconbtn" data-action="selection-mode" aria-label="@@ui.diagramSelectItems@@" title="@@ui.selectionHint@@" aria-pressed="false"><i data-icon="selectBox"></i></button>
            <button class="iconbtn" data-action="toggle-grid" aria-label="@@ui.showGrid@@" title="@@ui.showGrid@@" aria-pressed="false"><i data-icon="grid"></i></button>
          </div>
        </div>
        <details class="legend" id="graphLegend">
          <summary>
            <i data-icon="help"></i>@@ui.mapKey@@<i data-icon="chevron"></i>
          </summary>
          <div class="legend-content" id="legendContent"></div>
        </details>
      </div>
      <div class="scroll-view" id="otherView" hidden></div>
      <div class="workspace-history" id="workspaceHistory" role="group" aria-label="@@ui.undoRedo@@" hidden>
        <button type="button" class="iconbtn" data-history-command="undo" aria-label="@@ui.undo@@" title="@@ui.undoCtrlZ@@"><i data-icon="undo"></i></button>
        <button type="button" class="iconbtn" data-history-command="redo" aria-label="@@ui.redo@@" title="@@ui.redoCtrlShiftZ@@"><i data-icon="redo"></i></button>
      </div>
    </main>
    <button type="button" class="mobile-shade" data-action="close-mobile-panels" aria-label="@@ui.closeNavigation@@"></button>
    <aside class="inspector" id="inspector"></aside>
  </div>
</div>
`;
