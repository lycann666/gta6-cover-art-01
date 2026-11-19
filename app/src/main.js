// Vice City Cover Maker — editor wiring.
// Photos come from the user's own files (FileReader / object URLs) and are
// never uploaded. Export renders the same drawing at the chosen post size.
import { drawCover, GRADES, LAYOUTS, defaultPanels } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  photos: [],
  panels: defaultPanels('hero', 1),
  layout: 'hero',
  grade: 'sunset',
  caption: 'Sunset Heist',
  sub: 'Vice City Nights',
  accentWord: 'Welcome to',
  size: '1080x1080',
};

let activePanel = 0;

function redraw() {
  drawCover(canvas, state);
  renderPanelList();
}

function renderPanelList() {
  const list = $('panels');
  list.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-chip' + (i === activePanel ? ' active' : '');
    b.textContent = `Panel ${i + 1} · photo ${p.photo + 1}`;
    b.addEventListener('click', () => { activePanel = i; syncPanelControls(); redraw(); });
    list.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[activePanel] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
  $('panelPhoto').value = String(p.photo);
  $('zoom').value = String(p.zoom);
  $('shiftX').value = String(p.dx);
  $('shiftY').value = String(p.dy);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotos(files) {
  for (const file of files) {
    if (!file || !file.type.startsWith('image/')) continue;
    const img = await loadImageFile(file);
    state.photos.push(img);
  }
  if (state.photos.length > 0) {
    state.panels = defaultPanels(state.layout, state.photos.length);
    activePanel = 0;
    syncPanelControls();
    $('photoCount').textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded — kept on your device only.`;
  }
  redraw();
}

$('photo').addEventListener('change', (e) => addPhotos([...e.target.files]));
$('addPhoto').addEventListener('click', () => $('photo').click());

// layout + grade pickers
function buildPicker(el, items, current, onPick) {
  el.innerHTML = '';
  Object.entries(items).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (key === current ? ' active' : '');
    b.textContent = typeof label === 'string' ? label : label.name;
    b.addEventListener('click', () => { onPick(key); buildPicker(el, items, key, onPick); redraw(); });
    el.appendChild(b);
  });
}
buildPicker($('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  state.panels = defaultPanels(key, Math.max(1, state.photos.length));
  activePanel = 0;
  syncPanelControls();
});
buildPicker($('grades'), GRADES, state.grade, (key) => { state.grade = key; });

// caption fields
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('accentWord').addEventListener('input', (e) => { state.accentWord = e.target.value; redraw(); });
$('sub').addEventListener('input', (e) => { state.sub = e.target.value; redraw(); });

// panel controls
$('panelPhoto').addEventListener('change', (e) => {
  state.panels[activePanel].photo = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  state.panels[activePanel].zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
  redraw();
});
$('shiftX').addEventListener('input', (e) => { state.panels[activePanel].dx = Number(e.target.value); redraw(); });
$('shiftY').addEventListener('input', (e) => { state.panels[activePanel].dy = Number(e.target.value); redraw(); });

// export size
$('size').addEventListener('change', (e) => { state.size = e.target.value; });

$('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size] || SIZES['1080x1080'];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-cover-${state.size}.png`;
    window.__exported = true;
  }, 'image/png');
});

$('samplePier').addEventListener('click', async () => {
  const img = await loadImageUrl('samples/pier.jpg');
  state.photos.push(img);
  state.panels = defaultPanels(state.layout, state.photos.length);
  redraw();
});
$('sampleBoulevard').addEventListener('click', async () => {
  const img = await loadImageUrl('samples/boulevard.jpg');
  state.photos.push(img);
  state.panels = defaultPanels(state.layout, state.photos.length);
  redraw();
});

syncPanelControls();
redraw();

// Fixed screenshot scenes: ?shot=cover shows the cover alone,
// ?shot=editor shows the editor with a sample photo loaded.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    loadImageUrl,
    apply: async (scene) => {
      state.layout = scene.layout;
      state.grade = scene.grade;
      state.caption = scene.caption;
      state.sub = scene.sub;
      state.accentWord = scene.accentWord;
      const img = await loadImageUrl(`samples/${scene.photo}.jpg`);
      state.photos = [img];
      const img2 = await loadImageUrl(`samples/${scene.photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
      state.photos.push(img2);
      state.panels = defaultPanels(state.layout, state.photos.length);
      if (scene.size) {
        const [w, h] = scene.size.split('x').map(Number);
        canvas.width = w;
        canvas.height = h;
      }
      $('caption').value = scene.caption;
      $('sub').value = scene.sub;
      $('accentWord').value = scene.accentWord;
      $('photoCount').textContent = `${state.photos.length} photos loaded — kept on your device only.`;
      const markActive = (id, keys, current) => {
        [...document.querySelectorAll(`#${id} .pick`)].forEach((b, i) => {
          b.classList.toggle('active', keys[i] === current);
        });
      };
      markActive('layouts', Object.keys(LAYOUTS), state.layout);
      markActive('grades', Object.keys(GRADES), state.grade);
      redraw();
    },
  });
}
