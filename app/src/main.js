// Vice City Cover Maker — page wiring, written fresh for round 4.
// Uploads or sample photos, layout/grade/crop/caption controls, live preview
// on canvas, PNG export at 1080x1080, 1080x1350 or 1920x1080.
// `?shot=cover|editor` sets up a fixed scene for a screenshot instead and
// sets window.__shotReady once it has painted.
import { drawCover, LAYOUTS, GRADES } from './cover.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

const state = {
  photoA: null,
  photoB: null,
  layout: 'duo',
  grade: 'sunset',
  caption: 'Sunset Heist',
  accent: 'Vice City',
  cropA: { zoom: 1, dx: 0, dy: 0 },
  cropB: { zoom: 1, dx: 0, dy: 0 },
  editing: 'A',
};

const EXPORT_SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function currentCrop() {
  return state.editing === 'A' ? state.cropA : state.cropB;
}

function redraw() {
  drawCover(canvas, state);
}

function syncCropControls() {
  const crop = currentCrop();
  $('zoom').value = String(crop.zoom);
  $('panx').value = String(crop.dx);
  $('pany').value = String(crop.dy);
  $('editA').classList.toggle('active', state.editing === 'A');
  $('editB').classList.toggle('active', state.editing === 'B');
  $('cropLabel').textContent = `Editing Photo ${state.editing} (${state.editing === 'A' ? 'main panel' : 'second panel'})`;
}

function bindFile(inputId, slot) {
  $(inputId).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state[slot] = await loadImage(URL.createObjectURL(file));
      statusEl.textContent = `Photo ${slot === 'photoA' ? 'A' : 'B'} loaded — ${file.name}`;
      redraw();
    } catch {
      statusEl.textContent = 'That file could not be read as an image.';
    }
  });
}

function bindSample(buttonId, sample, slot) {
  $(buttonId).addEventListener('click', async () => {
    try {
      state[slot] = await loadImage(`samples/${sample}.jpg`);
      statusEl.textContent = `Sample ${sample} loaded as Photo ${slot === 'photoA' ? 'A' : 'B'}.`;
      redraw();
    } catch {
      statusEl.textContent = 'Sample photo failed to load.';
    }
  });
}

bindFile('photoA', 'photoA');
bindFile('photoB', 'photoB');
bindSample('samplePierA', 'pier', 'photoA');
bindSample('sampleBlvdA', 'boulevard', 'photoA');
bindSample('samplePierB', 'pier', 'photoB');
bindSample('sampleBlvdB', 'boulevard', 'photoB');

$('layout').addEventListener('change', (e) => {
  state.layout = LAYOUTS.includes(e.target.value) ? e.target.value : 'duo';
  redraw();
});
$('grade').addEventListener('change', (e) => {
  state.grade = GRADES.includes(e.target.value) ? e.target.value : 'sunset';
  redraw();
});
$('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
$('accent').addEventListener('input', (e) => {
  state.accent = e.target.value;
  redraw();
});
$('editA').addEventListener('click', () => { state.editing = 'A'; syncCropControls(); });
$('editB').addEventListener('click', () => { state.editing = 'B'; syncCropControls(); });
$('zoom').addEventListener('input', (e) => { currentCrop().zoom = Number(e.target.value); redraw(); });
$('panx').addEventListener('input', (e) => { currentCrop().dx = Number(e.target.value); redraw(); });
$('pany').addEventListener('input', (e) => { currentCrop().dy = Number(e.target.value); redraw(); });

$('export').addEventListener('click', () => {
  const size = EXPORT_SIZES[$('size').value] || EXPORT_SIZES.square;
  const off = document.createElement('canvas');
  off.width = size[0];
  off.height = size[1];
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — please try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size[0]}x${size[1]}.png`;
    a.click();
    statusEl.textContent = `Saved vice-city-cover-${size[0]}x${size[1]}.png`;
  }, 'image/png');
});

// Keep the live preview at the export size's aspect so what you see is the PNG.
$('size').addEventListener('change', () => {
  const size = EXPORT_SIZES[$('size').value] || EXPORT_SIZES.square;
  canvas.width = size[0];
  canvas.height = size[1];
  canvas.style.aspectRatio = `${size[0]} / ${size[1]}`;
  redraw();
});

/** Fixed screenshot scenes: ?shot=cover shows the cover alone, ?shot=editor the editor. */
async function runShot(query) {
  const shot = query.get('shot') || 'cover';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  if (layout && LAYOUTS.includes(layout)) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES.includes(grade)) state.grade = grade;
  state.caption = query.get('caption') || 'Sunset Heist';
  state.accent = query.get('accent') || 'Vice City';
  const w = Number(query.get('w') || '1080');
  const h = Number(query.get('h') || '1080');
  if (Number.isFinite(w) && Number.isFinite(h) && w >= 480 && h >= 480) {
    canvas.width = w;
    canvas.height = h;
  }
  try {
    state.photoA = await loadImage(`samples/${query.get('photo') || 'pier'}.jpg`);
    state.photoB = await loadImage(`samples/${query.get('photo2') || 'boulevard'}.jpg`);
  } catch {
    statusEl.textContent = 'Sample photo failed to load.';
  }
  if (document.fonts?.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch { /* fall back to system fonts */ }
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query);
} else {
  loadImage('samples/pier.jpg').then((img) => { state.photoA = img; redraw(); }).catch(() => redraw());
  loadImage('samples/boulevard.jpg').then((img) => { state.photoB = img; redraw(); }).catch(() => {});
  syncCropControls();
  redraw();
}
