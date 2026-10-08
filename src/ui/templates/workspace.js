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
      <span class="brandmark"><i data-icon="tree"></i></span>
      <div>
        <b>JurisTree</b><small>@@ui.peopleDocumentsRelationships@@</small>
      </div>
    </div>
    <div class="project-title">
      <button data-action="project" id="projectTitle">@@ui.myFamily@@</button
      ><span class="demo-tag" id="demoTag">@@ui.demo@@</span>
    </div>
    <div class="top-actions">
      <label class="language-control"
        ><span data-language-label>Language</span
        ><select data-language aria-label="Language">
          <option value="en">EN</option>
          <option value="uk">UA</option>
          <option value="ru">RU</option>
        </select></label
      ><button
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
      ><button class="btn" data-action="import">
        <i data-icon="upload"></i><span>@@ui.import2@@</span></button
      ><button class="btn primary" data-action="export">
        <i data-icon="download"></i><span>@@ui.exportTree@@</span>
      </button>
    </div>
  </header>
  <section class="global-search-bar" aria-label="@@ui.globalSearch@@">
    <div class="global-search-input"><i data-icon="search"></i><input id="globalSearch" type="search" autocomplete="off" placeholder="@@ui.globalSearchPlaceholder@@" aria-label="@@ui.globalSearch@@" aria-controls="globalSearchResults" aria-expanded="false"><button type="button" class="iconbtn small" data-action="clear-search" aria-label="@@ui.clearSearch@@"><i data-icon="x"></i></button></div>
    <button type="button" class="btn person-filter-toggle" data-action="person-filters" aria-haspopup="dialog" aria-pressed="false"><i data-icon="sliders"></i><span>@@ui.personFilters@@</span><b id="personFilterCount"></b></button>
    <div id="globalSearchResults" class="global-search-results" role="region" aria-label="@@ui.searchResults@@" hidden></div>
  </section>
  <div class="workspace">
    <aside class="sidebar" id="sidebar">
      <div class="purpose">
        <p class="section-label">@@ui.workspaceMode@@</p>
        <select id="purpose" aria-label="@@ui.treePurpose@@">
          <option value="inheritance">@@ui.inheritance2@@</option>
          <option value="family">@@ui.familyHistory2@@</option>
          <option value="property">@@ui.propertyAllocation2@@</option>
          <option value="research">@@ui.relationshipResearch2@@</option></select
        ><button class="scope-button" data-action="scope">
          <i data-icon="sliders"></i>@@ui.chooseVisibleData@@
        </button>
      </div>
      <section class="favorites-section"><p class="section-label">@@ui.workingPeople@@</p><div id="favoriteList"></div></section>
      <nav class="nav" aria-label="@@ui.workspaceSections@@">
        <p class="section-label nav-label">@@ui.workspaceSections@@</p>
        <button
          class="navbtn active"
          data-view="tree"
          title="@@ui.relationshipMapPeopleGroupsAndSearch@@"
        >
          <span class="nav-icon"><i data-icon="tree"></i></span
          ><span class="nav-text"
            ><b>@@ui.relationshipMap@@</b
            ><small>@@ui.peopleGroupsAndSearch@@</small></span
          ><span class="count" id="peopleCount"></span></button
        ><button
          class="navbtn"
          data-view="events"
          title="@@ui.eventsAndDatesAnniversariesAndTimeline@@"
        >
          <span class="nav-icon"><i data-icon="events"></i></span
          ><span class="nav-text"
            ><b>@@ui.eventsAndDates@@</b
            ><small>@@ui.anniversariesAndTimeline@@</small></span
          ><span class="count" id="eventCount"></span></button
        ><button class="navbtn" data-view="calendar"><span class="nav-icon"><i data-icon="calendarClock"></i></span><span class="nav-text"><b>@@ui.calendar@@</b><small>@@ui.birthdaysAndAnniversaries@@</small></span></button
        ><button
          class="navbtn"
          data-view="documents"
          title="@@ui.documentsSourcesAndDigitalCopies@@"
        >
          <span class="nav-icon"><i data-icon="sources"></i></span
          ><span class="nav-text"
            ><b>@@ui.documents@@</b
            ><small>@@ui.sourcesAndDigitalCopies@@</small></span
          ><span class="count" id="docCount"></span></button
        ><button
          class="navbtn"
          data-view="gaps"
          title="@@ui.evidenceAndGapsWhatNeedsConfirmation@@"
        >
          <span class="nav-icon"><i data-icon="gaps"></i></span
          ><span class="nav-text"
            ><b>@@ui.evidenceAndGaps@@</b
            ><small>@@ui.whatNeedsConfirmation@@</small></span
          ><span class="count warning" id="gapCount"></span></button
        ><button
          class="navbtn"
          data-view="property"
          title="@@ui.propertyOwnershipAndShares@@"
        >
          <span class="nav-icon"><i data-icon="property"></i></span
          ><span class="nav-text"
            ><b>@@ui.property@@</b
            ><small>@@ui.ownershipAndShares@@</small></span
          ><span class="count" id="assetCount"></span>
        </button>
      </nav>
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
      <div class="mobile-map-bar">
        <button class="btn" data-action="mobile-tools" aria-expanded="false" aria-controls="mapSettings"><i data-icon="sliders"></i><span>@@ui.mapOptions@@</span></button>
        <button class="iconbtn" data-action="focus-person" aria-label="@@ui.focusPerson@@" title="@@ui.focusPerson@@"><i data-icon="user"></i></button>
        <button class="btn" data-action="touch-move" aria-pressed="false"><i data-icon="move"></i><span>@@ui.moveCards@@</span></button>
        <p id="mobileMapHint">@@ui.mobileMapHint@@</p>
      </div>
      <div id="favoriteRail" class="favorite-rail" hidden></div>
      <div class="map-settings" id="mapSettings">
      <div class="status-board" id="statusBoard"></div>
      <div id="pathPanel"></div>
      <section
        class="graph-toolbar"
        id="graphToolbar"
        aria-label="@@ui.analysisTools@@"
      ></section>
      </div>
      <section
        class="graph-context"
        id="graphContext"
        hidden
        aria-label="@@ui.currentAnalysisResult@@"
      ></section>
      <div class="canvas-wrap" id="canvasWrap">
        <div class="canvas-top">
          <div class="map-key">
            <span class="key-parent"
              ><i data-icon="people"></i>@@ui.parents@@</span
            ><span class="key-self"
              ><i data-icon="selectedPerson"></i>@@ui.selectedPerson@@</span
            ><span class="key-child"
              ><i data-icon="tree"></i>@@ui.children@@</span
            >
          </div>
          <div class="canvas-hint">
            <i data-icon="route"></i>@@ui.directedRelationshipHint@@
          </div>
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
            ><button
              class="iconbtn"
              data-action="layout"
              aria-label="@@ui.arrangeGenerations@@"
              title="@@ui.arrangeGenerations@@"
            >
              <i data-icon="layout"></i>
            </button>
          </div>
        </div>
        <details class="legend" id="graphLegend">
          <summary>
            <i data-icon="help"></i>@@ui.lineKey@@<i data-icon="chevron"></i>
          </summary>
          <div class="legend-content" id="legendContent"></div>
        </details>
      </div>
      <div class="scroll-view" id="otherView" hidden></div>
    </main>
    <button type="button" class="mobile-shade" data-action="close-mobile-panels" aria-label="@@ui.closeNavigation@@"></button>
    <aside class="inspector" id="inspector"></aside>
  </div>
</div>
`;
