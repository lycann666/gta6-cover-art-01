// Vice City Cover Maker — wires the editor: photo loading, per-panel crop, layout and
// grade choices, caption editing, and one-click PNG export in three post sizes.
import { drawCover, panelRects, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const sizeLabel = document.getElementById('sizeLabel');
const selectedLabel = document.getElementById('selectedLabel');

const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, name: 'cover-1080x1080.png' },
  portrait: { w: 1080, h: 1350, name: 'cover-1080x1350.png' },
  wide: { w: 1920, h: 1080, name: 'cover-1920x1080.png' },
};

const state = {
  photos: [null, null, null, null],
  crops: [0, 1, 2, 3].map(() => ({ zoom: 1.2, panX: 0, panY: 0 })),
  layout: 'grid',
  grade: 'sunset',
  title: 'VICE CITY',
  subtitle: 'one night in the neon',
  showSun: true, showPalms: true, showSkyline: true,
  selected: 0,
  exportSize: 'square',
};

function panelCount() { return LAYOUTS[state.layout].panels; }

function redraw() {
  drawCover(canvas, state);
  sizeLabel.textContent = `${EXPORT_SIZES[state.exportSize].w} × ${EXPORT_SIZES[state.exportSize].h}`;
  selectedLabel.textContent = `Panel ${state.selected + 1} of ${panelCount()}`;
  buildPanelTabs();
}

function buildPanelTabs() {
  const tabs = document.getElementById('panelTabs');
  tabs.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = state.photos[i] ? `Panel ${i + 1} · photo ✓` : `Panel ${i + 1} · empty`;
    if (i === state.selected) b.classList.add('active');
    b.addEventListener('click', () => { state.selected = i; syncCropInputs(); redraw(); });
    tabs.appendChild(b);
  }
}

function syncCropInputs() {
  const c = state.crops[state.selected];
  document.getElementById('zoom').value = c.zoom;
  document.getElementById('panX').value = c.panX;
  document.getElementById('panY').value = c.panY;
  document.getElementById('zoomVal').textContent = `${Number(c.zoom).toFixed(2)}×`;
  document.getElementById('panXVal').textContent = c.panX;
  document.getElementById('panYVal').textContent = c.panY;
}

/** Loads an image from a URL, resolving once it can be drawn on canvas. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadPhotoFromFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  state.photos[state.selected] = img;
  status.textContent = `Loaded “${file.name}” into panel ${state.selected + 1}.`;
  redraw();
}

async function loadSample(name) {
  const url = `./samples/${name}.jpg`;
  const img = await loadImage(url);
  state.photos[state.selected] = img;
  status.textContent = `Sample “${name}” loaded into panel ${state.selected + 1}.`;
  redraw();
}

function fillAllWith(img) {
  for (let i = 0; i < panelCount(); i++) state.photos[i] = img;
}

/** Renders the cover at an export size and downloads it as a PNG. */
export function exportCover(sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = size.name;
      a.click();
      status.textContent = `Saved ${size.name} (${size.w} × ${size.h}).`;
      resolve(size.name);
    }, 'image/png');
  });
}

// Photo inputs.
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) { try { await loadPhotoFromFile(file); } catch { status.textContent = 'That file could not be read as a photo.'; } }
});
document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));
document.getElementById('fillAll').addEventListener('click', () => {
  const img = state.photos[state.selected];
  if (!img) { status.textContent = 'Load a photo first, then fill all panels with it.'; return; }
  fillAllWith(img);
  status.textContent = `All ${panelCount()} panels now use the same photo.`;
  redraw();
});
document.getElementById('fillSelected').addEventListener('click', () => {
  status.textContent = `Panel ${state.selected + 1} keeps its own photo — pick another file to change it.`;
});

// Layout and grade choices.
document.getElementById('layoutChoices').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  state.selected = 0;
  document.querySelectorAll('#layoutChoices .choice').forEach((b) => b.classList.toggle('active', b === btn));
  syncCropInputs(); redraw();
});
document.getElementById('gradeChoices').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  document.querySelectorAll('#gradeChoices .choice').forEach((b) => b.classList.toggle('active', b === btn));
  redraw();
});

// Per-panel crop sliders.
for (const [id, key, fmt] of [['zoom', 'zoom', (v) => `${Number(v).toFixed(2)}×`], ['panX', 'panX', (v) => v], ['panY', 'panY', (v) => v]]) {
  document.getElementById(id).addEventListener('input', (e) => {
    state.crops[state.selected][key] = Number(e.target.value);
    document.getElementById(`${id}Val`).textContent = fmt(e.target.value);
    redraw();
  });
}

// Caption and motif toggles.
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('showSun').addEventListener('change', (e) => { state.showSun = e.target.checked; redraw(); });
document.getElementById('showPalms').addEventListener('change', (e) => { state.showPalms = e.target.checked; redraw(); });
document.getElementById('showSkyline').addEventListener('change', (e) => { state.showSkyline = e.target.checked; redraw(); });

// Export buttons.
document.getElementById('exportSquare').addEventListener('click', () => { state.exportSize = 'square'; exportCover('square'); });
document.getElementById('exportPortrait').addEventListener('click', () => { state.exportSize = 'portrait'; exportCover('portrait'); });
document.getElementById('exportWide').addEventListener('click', () => { state.exportSize = 'wide'; exportCover('wide'); });

// Clicking the preview picks the panel under the cursor.
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * canvas.width;
  const py = ((e.clientY - r.top) / r.height) * canvas.height;
  const bandH = canvas.height * (state.layout === 'full' ? 0.30 : 0.27);
  const area = { x: canvas.width * 0.03, y: canvas.height * 0.03, w: canvas.width * 0.94, h: canvas.height - bandH - canvas.height * 0.055 };
  const rects = panelRects(state.layout, area);
  rects.forEach((rect, i) => {
    if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
      state.selected = i; syncCropInputs(); redraw();
    }
  });
});

// Screenshot scenes (?shot=cover / ?shot=editor) and first paint.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
// A shot may ask for a different export aspect (size=wide|portrait|square):
// resize the preview canvas first so the cover fills the screenshot frame.
const shotSize = params.get('size');
if (shotSize && EXPORT_SIZES[shotSize]) {
  canvas.width = EXPORT_SIZES[shotSize].w;
  canvas.height = EXPORT_SIZES[shotSize].h;
  state.exportSize = shotSize;
}
if (shot) {
  runShot(shot, params, async (sample, caption) => {
    const img = await loadImage(sample);
    fillAllWith(img);
    document.getElementById('title').value = caption;
    state.title = caption;
    redraw();
  });
} else {
  redraw();
}

// Wait for the shipped fonts before the first real paint, so the title renders in Anton.
if (document.fonts?.ready) document.fonts.ready.then(() => redraw());
