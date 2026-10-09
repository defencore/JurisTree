export const dialogsTemplate = `
<dialog class="dialog" id="modal">
  <form id="modalForm">
    <div class="modal-head" tabindex="0" title="@@ui.moveWindowHint@@">
      <h2 id="modalTitle"></h2>
      <button type="button" class="iconbtn small ghost" data-reset-window aria-label="@@ui.resetWindowPosition@@" title="@@ui.resetWindowPosition@@"><i data-icon="layout"></i></button>
      <button
        type="button"
        class="iconbtn ghost"
        data-close
        aria-label="@@ui.close@@"
      >
        <i data-icon="x"></i>
      </button>
    </div>
    <div class="modal-body">
      <p class="modal-error" id="modalError" role="alert"></p>
      <div id="modalContent"></div>
    </div>
    <div class="modal-foot" id="modalFooter"></div>
  </form>
</dialog>
<dialog class="dialog wide" id="cropDialog">
  <div class="modal-head" tabindex="0" title="@@ui.moveWindowHint@@">
    <h2 id="cropTitle">@@ui.prepareImage@@</h2>
    <button type="button" class="iconbtn small ghost" data-reset-window aria-label="@@ui.resetWindowPosition@@" title="@@ui.resetWindowPosition@@"><i data-icon="layout"></i></button>
    <button class="iconbtn ghost" id="cropCancelTop" aria-label="@@ui.cancel@@">
      <i data-icon="x"></i>
    </button>
  </div>
  <div class="modal-body">
    <div class="crop-controls">
      <button class="btn small" id="cropRotate">
        <i data-icon="rotate"></i>@@ui.rotate@@</button
      ><button class="btn small" id="cropReset">@@ui.fullImage@@</button
      ><label
        >@@ui.longEdge@@
        <select id="cropSize">
          <option value="1600">1600 px</option>
          <option value="2400" selected>2400 px</option>
          <option value="3200">3200 px</option>
        </select></label
      ><label
        >@@ui.quality@@
        <select id="cropQuality">
          <option value=".7">70%</option>
          <option value=".84" selected>84%</option>
          <option value=".94">94%</option>
        </select></label
      >
    </div>
    <div class="crop-stage"><canvas id="cropCanvas"></canvas></div>
    <p class="hint" id="cropHint">
      @@ui.selectTheRequiredAreaKeepAllDocumentText@@
    </p>
    <div class="upload-info" id="cropInfo"></div>
  </div>
  <div class="modal-foot">
    <button class="btn" id="cropCancel">@@ui.cancel@@</button
    ><button class="btn primary" id="cropSave">@@ui.saveImage@@</button>
  </div>
</dialog>
<input
  type="file"
  id="fileInput"
  class="upload-hidden"
  accept="image/jpeg,image/png,image/webp,application/pdf,.txt,.docx,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.mov"
  multiple
/><input
  type="file"
  id="importInput"
  class="upload-hidden"
  accept=".zip,.json"
/>
<div id="biographyPrint"></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
`;
