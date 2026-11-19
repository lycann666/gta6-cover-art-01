// Vice Cover Studio — the editor.
// Owns the app state (photos, per-panel crops, layout, grade, caption),
// the live preview, undo/redo, PNG export, and the deterministic ?shot=
// scenes used for screenshots. Photos never leave the machine: they are
// read from local files or the bundled samples and drawn straight to canvas.
import { EXPORT_SIZES, LAYOUTS, GRADES, layoutById, gradeById, panelRects, drawCover, exportCoverPng } from './cover.js';

const $ = (id) => document.getElementById(id);
const query = new URLSearchParams(location.search);
const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

const state = {
  photos: [], // {id, name, img, dataUrl}
  panels: [], // {photo, crop:{x,y,zoom}} one per panel of the layout
  layout: 'hero',
  grade: 'sunset',
  motif: 'sun',
  title: 'VICE SUNSET',
  subtitle: 'a vice city story',
  sizeId: 'wide',
  selected: 0,
};

let undoStack = [];
let redoStack = [];
let drag = null; // {panel, startX, startY, crop}
let photoSeq = 0;

function snapshot() {
  return JSON.stringify({
    panels: state.panels, layout: state.layout, grade: state.grade,
    motif: state.motif, title: state.title, subtitle: state.subtitle,
    sizeId: state.sizeId, selected: state.selected,
    photoIds: state.photos.map((p) => p.id),
  });
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  state.panels = s.panels;
  state.layout = s.layout; state.grade = s.grade; state.motif = s.motif;
  state.title = s.title; state.subtitle = s.subtitle;
  state.sizeId = s.sizeId; state.selected = s.selected;
  state.photos = s.photoIds.map((id) => state.photos.find((p) => p.id === id)).filter(Boolean);
  syncControls();
  redraw();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  refreshUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  refreshUndoButtons();
}

function refreshUndoButtons() {
  $('undo').disabled = !undoStack.length;
  $('redo').disabled = !redoStack.length;
}

function panelCount() {
  return layoutById(state.layout).panels;
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push({ photo: 0, crop: { x: 0, y: 0, zoom: 1 } });
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

async function addPhoto(src, name) {
  const img = await loadImage(src);
  const photo = { id: `p${++photoSeq}`, name, img, dataUrl: src };
  state.photos.push(photo);
  renderPhotoStrip();
  return photo;
}

async function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id) || SAMPLES[0];
  const existing = state.photos.find((p) => p.name === sample.name);
  if (existing) return existing;
  return addPhoto(sample.src, sample.name);
}

function renderPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `Use ${photo.name} in the selected panel`;
    const img = document.createElement('img');
    img.src = photo.dataUrl;
    img.alt = photo.name;
    b.appendChild(img);
    const label = document.createElement('span');
    label.textContent = photo.name;
    b.appendChild(label);
    b.addEventListener('click', () => {
      pushUndo();
      ensurePanels();
      state.panels[state.selected].photo = i;
      redraw();
    });
    strip.appendChild(b);
  });
}

function redraw() {
  const canvas = $('preview');
  const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[2];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, state);
  renderPanelChips();
}

function renderPanelChips() {
  const wrap = $('panelChips');
  wrap.innerHTML = '';
  const n = panelCount();
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === state.selected ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => { state.selected = i; syncPanelControls(); redraw(); });
    wrap.appendChild(b);
  }
}

function syncPanelControls() {
  ensurePanels();
  const panel = state.panels[state.selected];
  $('zoom').value = panel.crop.zoom;
  $('zoomVal').textContent = `${Math.round(panel.crop.zoom * 100)}%`;
  $('panelPhoto').textContent = state.photos[panel.photo]?.name || '—';
}

function syncControls() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#motifRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.motif === state.motif);
  });
  document.querySelectorAll('#sizeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.sizeId);
  });
  syncPanelControls();
}

function buildControlRows() {
  const layoutRow = $('layoutRow');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.layout = l.id; b.textContent = l.name;
    b.addEventListener('click', () => { pushUndo(); state.layout = l.id; ensurePanels(); syncControls(); redraw(); });
    layoutRow.appendChild(b);
  });
  const gradeRow = $('gradeRow');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.grade = g.id;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]}, ${g.sky[2]})"></span>${g.name}`;
    b.addEventListener('click', () => { pushUndo(); state.grade = g.id; syncControls(); redraw(); });
    gradeRow.appendChild(b);
  });
  const motifRow = $('motifRow');
  [['sun', 'Retro sun'], ['palms', 'Palms'], ['skyline', 'Skyline']].forEach(([id, name]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.motif = id; b.textContent = name;
    b.addEventListener('click', () => { pushUndo(); state.motif = id; syncControls(); redraw(); });
    motifRow.appendChild(b);
  });
  const sizeRow = $('sizeRow');
  EXPORT_SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.size = s.id; b.textContent = s.label;
    b.addEventListener('click', () => { state.sizeId = s.id; syncControls(); redraw(); });
    sizeRow.appendChild(b);
  });
}

function bindEvents() {
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('titleInput').addEventListener('change', pushUndo);
  $('subtitleInput').addEventListener('change', pushUndo);
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('zoom').addEventListener('input', (e) => {
    ensurePanels();
    state.panels[state.selected].crop.zoom = Number(e.target.value);
    syncPanelControls();
    redraw();
  });
  $('zoom').addEventListener('change', pushUndo);
  $('fillAll').addEventListener('click', () => {
    pushUndo();
    ensurePanels();
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    redraw();
  });
  $('resetCrop').addEventListener('click', () => {
    pushUndo();
    ensurePanels();
    state.panels[state.selected].crop = { x: 0, y: 0, zoom: 1 };
    syncPanelControls();
    redraw();
  });
  $('upload').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const url = URL.createObjectURL(file);
      try {
        const photo = await addPhoto(url, file.name.replace(/\.[^.]+$/, ''));
        pushUndo();
        ensurePanels();
        state.panels[state.selected].photo = state.photos.length - 1;
        redraw();
      } catch (err) {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    e.target.value = '';
  });
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.addEventListener('click', async () => {
      const photo = await loadSample(b.dataset.sample);
      pushUndo();
      ensurePanels();
      state.panels[state.selected].photo = state.photos.indexOf(photo);
      redraw();
      setStatus(`Loaded sample photo ${photo.name}.`);
    });
  });
  $('exportBtn').addEventListener('click', () => {
    const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[2];
    const { dataUrl } = exportCoverPng(state, size);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setStatus(`Exported vice-cover-${size.w}x${size.h}.png — share it anywhere.`);
  });

  // Drag on the preview pans the selected panel's photo; click picks a panel.
  const canvas = $('preview');
  const pickPanel = (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * canvas.width;
    const py = ((e.clientY - r.top) / r.height) * canvas.height;
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const hit = rects.findIndex((rc) => px >= rc.x && px <= rc.x + rc.w && py >= rc.y && py <= rc.y + rc.h);
    return hit >= 0 ? hit : null;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const hit = pickPanel(e);
    if (hit === null) return;
    state.selected = hit;
    syncPanelControls();
    redraw();
    ensurePanels();
    drag = { panel: hit, x: e.clientX, y: e.clientY, crop: { ...state.panels[hit].crop } };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const rect = rects[drag.panel];
    const dx = ((e.clientX - drag.x) / r.width) * canvas.width;
    const dy = ((e.clientY - drag.y) / r.height) * canvas.height;
    const panel = state.panels[drag.panel];
    const img = state.photos[panel.photo]?.img;
    if (img) {
      const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.crop.zoom;
      const overX = Math.max(1, (img.naturalWidth * scale - rect.w) / 2);
      const overY = Math.max(1, (img.naturalHeight * scale - rect.h) / 2);
      panel.crop.x = clamp(drag.crop.x - dx / overX, -1, 1);
      panel.crop.y = clamp(drag.crop.y - dy / overY, -1, 1);
    }
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag) { pushUndo(); drag = null; }
  });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function setStatus(text) {
  $('status').textContent = text;
}

// Deterministic scenes for screenshots. ?shot=cover shows the exported PNG
// itself, full-frame; ?shot=editor shows the editor with a sample loaded.
async function runShot() {
  const shot = query.get('shot');
  if (!shot) return false;
  const photoId = query.get('photo') || 'boulevard';
  const layout = query.get('layout') || 'hero';
  const grade = query.get('grade') || 'sunset';
  const motif = query.get('motif') || 'sun';
  const sizeId = query.get('size') || 'wide';
  state.title = query.get('caption') || 'VICE SUNSET';
  state.subtitle = query.get('sub') || 'a vice city story';
  state.layout = layout; state.grade = grade; state.motif = motif; state.sizeId = sizeId;
  const photo = await loadSample(photoId);
  const other = await loadSample(photoId === 'pier' ? 'boulevard' : 'pier');
  ensurePanels();
  state.panels.forEach((p, i) => { p.photo = i % 2 === 0 ? state.photos.indexOf(photo) : state.photos.indexOf(other); });
  syncControls();
  // Fonts must be ready before any canvas text is drawn, or the title
  // falls back to a plain sans-serif face in the export.
  await document.fonts.ready;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[2];
    const { dataUrl, w, h } = exportCoverPng(state, size);
    const img = document.createElement('img');
    img.id = 'coverShot';
    img.src = dataUrl;
    img.alt = `Exported cover ${w} by ${h}`;
    document.body.appendChild(img);
    document.title = `EXPORT ${w}x${h} ${dataUrl.length}B ok`;
    window.__shotReady = true;
    return true;
  }
  // editor scene: preview at the chosen export size, samples loaded.
  redraw();
  redraw();
  window.__shotReady = true;
  return true;
}

async function boot() {
  buildControlRows();
  bindEvents();
  ensurePanels();
  syncControls();
  refreshUndoButtons();
  const shotTaken = await runShot();
  if (!shotTaken) {
    // First run: load both samples so the editor is never empty.
    await loadSample('boulevard');
    await loadSample('pier');
    ensurePanels();
    state.panels.forEach((p, i) => { p.photo = i % 2; });
    syncControls();
    redraw();
  }
  setStatus('Pick a layout and a grade, load your photos, then export a PNG.');
}

boot();
