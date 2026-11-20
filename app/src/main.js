// Vice City Cover Maker — editor wiring and screenshot ("shot") mode.
// Loads the user's photos (or the bundled samples), keeps the live preview
// in sync with every control, and exports the cover as a PNG.
// Shot mode (?shot=cover / ?shot=editor) renders a fixed cover for screenshots.

import { drawCover, exportCoverPNG, emptyPhoto, SIZES, LAYOUTS, GRADES } from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  photos: [emptyPhoto(), emptyPhoto()],
  layout: 'duo',
  grade: 'sunset',
  size: 'wide',
  caption: 'Sunset Heist',
  sub: 'Vice City',
  activeSlot: 0,
};

const preview = $('#preview');
let drawQueued = false;

function queueDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    drawCover(preview, {
      photos: state.photos,
      layout: state.layout,
      grade: state.grade,
      caption: state.caption,
      sub: state.sub,
      size: SIZES[state.size],
    });
    fitPreviewToStage();
    window.__coverReady = true;
  });
}

function fitPreviewToStage() {
  // In shot-cover mode the canvas fills the viewport; in the editor it fits
  // the stage box while keeping its aspect ratio.
  const stage = $('#stage');
  if (!stage) return;
  const box = stage.getBoundingClientRect();
  const { w, h } = SIZES[state.size];
  const scale = Math.min(box.width / w, box.height / h, 1.4);
  preview.style.width = `${Math.round(w * scale)}px`;
  preview.style.height = `${Math.round(h * scale)}px`;
}

function setStatus(text) {
  const el = $('#statusLine');
  if (el) el.textContent = text;
}

function loadImageFile(file, slot) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0 };
      state.activeSlot = slot;
      syncSlotControls();
      queueDraw();
      setStatus(`Photo ${slot === 0 ? 'A' : 'B'} loaded — drag the sliders to crop and position it.`);
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function loadSample(name, slot) {
  const img = new Image();
  img.onload = () => {
    state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0 };
    state.activeSlot = slot;
    syncSlotControls();
    queueDraw();
    setStatus(`Sample “${name}” loaded into Photo ${slot === 0 ? 'A' : 'B'}.`);
  };
  img.onerror = () => setStatus(`Could not load sample ${name}.`);
  img.src = `samples/${name}.jpg`;
}

function syncSlotControls() {
  const photo = state.photos[state.activeSlot];
  const zoom = $('#zoomRange');
  const panX = $('#panXRange');
  const panY = $('#panYRange');
  if (zoom) zoom.value = String(photo.zoom);
  if (panX) panX.value = String(photo.ox);
  if (panY) panY.value = String(photo.oy);
  $$('#slotTabs button').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.slot) === state.activeSlot);
  });
  const label = $('#slotLabel');
  if (label) {
    label.textContent = state.activeSlot === 0
      ? 'Editing Photo A (main panel)'
      : 'Editing Photo B (side panel)';
  }
}

function markActive(group, value) {
  $$(`[data-${group}]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset[group] === value);
  });
}

function bindControls() {
  $('#captionInput').addEventListener('input', (e) => {
    state.caption = e.target.value;
    queueDraw();
  });
  $('#subInput').addEventListener('input', (e) => {
    state.sub = e.target.value;
    queueDraw();
  });
  $$('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      markActive('layout', state.layout);
      queueDraw();
      setStatus(`Layout: ${LAYOUTS[state.layout]}.`);
    });
  });
  $$('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      markActive('grade', state.grade);
      queueDraw();
      setStatus(`Colour grade: ${GRADES[state.grade].label}.`);
    });
  });
  $$('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      markActive('size', state.size);
      queueDraw();
      setStatus(`Export size: ${SIZES[state.size].label}.`);
    });
  });
  $$('#slotTabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeSlot = Number(btn.dataset.slot);
      syncSlotControls();
    });
  });
  $('#zoomRange').addEventListener('input', (e) => {
    state.photos[state.activeSlot].zoom = Number(e.target.value);
    queueDraw();
  });
  $('#panXRange').addEventListener('input', (e) => {
    state.photos[state.activeSlot].ox = Number(e.target.value);
    queueDraw();
  });
  $('#panYRange').addEventListener('input', (e) => {
    state.photos[state.activeSlot].oy = Number(e.target.value);
    queueDraw();
  });
  $('#uploadA').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) loadImageFile(e.target.files[0], 0);
  });
  $('#uploadB').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) loadImageFile(e.target.files[0], 1);
  });
  $$('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadSample(btn.dataset.sample, Number(btn.dataset.slot));
    });
  });
  $('#exportBtn').addEventListener('click', async () => {
    setStatus('Exporting PNG…');
    const ok = await exportCoverPNG(preview, state.size);
    setStatus(ok
      ? `Exported vice-city-cover-${state.size}.png (${SIZES[state.size].label}).`
      : 'Export failed in this browser — try desktop Chrome.');
  });
  window.addEventListener('resize', fitPreviewToStage);
}

// ---- Shot mode: deterministic renders for the entry's screenshots. ----
function applyShotParams(params) {
  const shot = params.get('shot');
  if (!shot) return false;
  const photo = params.get('photo') || 'pier';
  const caption = params.get('caption');
  const sub = params.get('sub');
  const layout = params.get('layout');
  const grade = params.get('grade');
  const size = params.get('size');
  if (caption) { state.caption = caption; $('#captionInput').value = caption; }
  if (sub) { state.sub = sub; $('#subInput').value = sub; }
  if (layout && LAYOUTS[layout]) { state.layout = layout; markActive('layout', layout); }
  if (grade && GRADES[grade]) { state.grade = grade; markActive('grade', grade); }
  if (size && SIZES[size]) { state.size = size; markActive('size', size); }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  // Shot renders load the sample into both slots so every layout is full.
  return new Promise((resolve) => {
    let done = 0;
    const both = () => { done += 1; if (done === 2) resolve(); };
    const imgA = new Image();
    imgA.onload = () => { state.photos[0] = { img: imgA, zoom: 1, ox: 0, oy: 0 }; both(); };
    imgA.onerror = both;
    imgA.src = `samples/${photo}.jpg`;
    const other = photo === 'pier' ? 'boulevard' : 'pier';
    const imgB = new Image();
    imgB.onload = () => { state.photos[1] = { img: imgB, zoom: 1.05, ox: 0.1, oy: -0.05 }; both(); };
    imgB.onerror = both;
    imgB.src = `samples/${other}.jpg`;
  });
}

async function start() {
  bindControls();
  syncSlotControls();
  // Wait for the bundled fonts so the caption lettering draws correctly.
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 60px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // If a font fails, the canvas still draws with the fallback stack.
  }
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    await applyShotParams(params);
    queueDraw();
    // One extra draw after fonts settle, so lettering is never fallback.
    setTimeout(queueDraw, 250);
  } else {
    queueDraw();
    setStatus('Add your photo, pick a layout and a grade, then export your cover.');
  }
}

start();
