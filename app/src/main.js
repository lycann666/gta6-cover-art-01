// Wires the Vice Cover editor: two photo slots read with FileReader, layout
// and grade chips, per-panel crop controls, caption fields, and PNG export
// in three post sizes. A `?shot=` query hands the page to shots.js instead.

import { drawCover, defaultPanels, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionEl = document.getElementById('caption');
const subEl = document.getElementById('sub');
const statusEl = document.getElementById('status');
const panelPick = document.getElementById('panelPick');
const panelSrc = document.getElementById('panelSrc');
const panelZoom = document.getElementById('panelZoom');
const panelDx = document.getElementById('panelDx');
const panelDy = document.getElementById('panelDy');
const zoomVal = document.getElementById('zoomVal');

const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: captionEl.value,
  sub: subEl.value,
  photos: { a: null, b: null },
  panels: defaultPanels(),
};

let exportW = 1080;
let exportH = 1080;
let activePanel = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result).then(resolve, reject);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function redraw() {
  state.caption = captionEl.value;
  state.sub = subEl.value;
  drawCover(canvas, state);
}

function syncPanelControls() {
  const count = LAYOUTS[state.layout].panels.length;
  panelPick.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === activePanel ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => { activePanel = i; syncPanelControls(); });
    panelPick.appendChild(b);
  }
  const cfg = state.panels[activePanel];
  panelSrc.value = cfg.src;
  panelZoom.value = String(cfg.zoom);
  panelDx.value = String(cfg.dx);
  panelDy.value = String(cfg.dy);
  zoomVal.textContent = `${cfg.zoom.toFixed(2)}×`;
}

function markActive(container, attr, value) {
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset[attr] === String(value));
  });
}

function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function doExport() {
  const blob = await exportPNG(exportW, exportH);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${exportW}x${exportH}.png`;
  a.click();
  statusEl.textContent = `Saved vice-cover-${exportW}x${exportH}.png`;
}

// Photo slots.
document.getElementById('photoA').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.photos.a = await readFileAsImage(file);
  redraw();
});
document.getElementById('photoB').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.photos.b = await readFileAsImage(file);
  redraw();
});
document.getElementById('useSamples').addEventListener('click', async () => {
  state.photos.a = await loadImage('samples/pier.jpg');
  state.photos.b = await loadImage('samples/boulevard.jpg');
  statusEl.textContent = 'Sample photos loaded — replace them with your own.';
  redraw();
});

// Layout + grade chips.
document.getElementById('layouts').addEventListener('click', (e) => {
  const layout = e.target.dataset?.layout;
  if (!layout) return;
  state.layout = layout;
  activePanel = 0;
  markActive(e.currentTarget, 'layout', layout);
  syncPanelControls();
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const grade = e.target.dataset?.grade;
  if (!grade) return;
  state.grade = grade;
  markActive(e.currentTarget, 'grade', grade);
  redraw();
});

// Caption fields.
captionEl.addEventListener('input', redraw);
subEl.addEventListener('input', redraw);

// Per-panel crop controls.
panelSrc.addEventListener('change', () => {
  state.panels[activePanel].src = panelSrc.value;
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.panels[activePanel].zoom = Number(panelZoom.value);
  zoomVal.textContent = `${Number(panelZoom.value).toFixed(2)}×`;
  redraw();
});
panelDx.addEventListener('input', () => {
  state.panels[activePanel].dx = Number(panelDx.value);
  redraw();
});
panelDy.addEventListener('input', () => {
  state.panels[activePanel].dy = Number(panelDy.value);
  redraw();
});

// Export sizes + button.
document.getElementById('sizes').addEventListener('click', (e) => {
  const w = e.target.dataset?.w;
  const h = e.target.dataset?.h;
  if (!w || !h) return;
  exportW = Number(w);
  exportH = Number(h);
  markActive(e.currentTarget, 'w', w);
  canvas.width = exportW;
  canvas.height = exportH;
  redraw();
});
document.getElementById('export').addEventListener('click', doExport);

// Test / screenshot hooks: render any size and hand back a PNG data URL.
window.__vice = {
  state,
  redraw,
  exportDataURL: async (w, h) => {
    const blob = await exportPNG(w, h);
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  },
};

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    loadSample: (name) => loadImage(`samples/${name}.jpg`),
    apply: (cfg) => {
      state.layout = cfg.layout;
      state.grade = cfg.grade;
      captionEl.value = cfg.caption;
      subEl.value = cfg.sub;
      if (cfg.w && cfg.h) { canvas.width = cfg.w; canvas.height = cfg.h; }
      markActive(document.getElementById('layouts'), 'layout', cfg.layout);
      markActive(document.getElementById('grades'), 'grade', cfg.grade);
      syncPanelControls();
    },
    setPhotos: (a, b) => { state.photos.a = a; state.photos.b = b; },
    draw: () => redraw(),
  });
} else {
  syncPanelControls();
  redraw();
}
