// Vice City Cover Maker — draws a GTA-style poster cover on a canvas.
// Photos are plain Image objects (or null). Everything is drawn locally;
// nothing is uploaded anywhere.
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff5e62', '#b83280'],
    tint: 'rgba(255, 94, 98, 0.28)',
    band: '#1b0f2e',
    accent: '#ffd166',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#0f0c29', '#302b63', '#ff2e88'],
    tint: 'rgba(46, 226, 255, 0.20)',
    band: '#0a0618',
    accent: '#2ee2ff',
  },
  miami: {
    name: 'Miami Pop',
    sky: ['#ff6ec7', '#7873f5', '#4adede'],
    tint: 'rgba(255, 110, 199, 0.22)',
    band: '#14102e',
    accent: '#4adede',
  },
  noir: {
    name: 'Noir Gold',
    sky: ['#232526', '#414345', '#c9a227'],
    tint: 'rgba(201, 162, 39, 0.18)',
    band: '#0d0d0d',
    accent: '#c9a227',
  },
};

export const LAYOUTS = {
  hero: 'Hero + side panels',
  grid: 'Four-panel grid',
  full: 'Full-bleed photo',
};

// One panel: which photo index, zoom (1 = cover), x/y shift in fractions.
function panelRects(layout, w, h) {
  const gap = Math.round(Math.min(w, h) * 0.012);
  if (layout === 'grid') {
    const hw = (w - gap) / 2, hh = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: hw, h: hh },
      { x: hw + gap, y: 0, w: hw, h: hh },
      { x: 0, y: hh + gap, w: hw, h: hh },
      { x: hw + gap, y: hh + gap, w: hw, h: hh },
    ];
  }
  if (layout === 'full') return [{ x: 0, y: 0, w, h }];
  // hero: big panel left (62%), two stacked panels right
  const bw = Math.round(w * 0.62);
  const rw = w - bw - gap;
  const rh = (h - gap) / 2;
  return [
    { x: 0, y: 0, w: bw, h },
    { x: bw + gap, y: 0, w: rw, h: rh },
    { x: bw + gap, y: rh + gap, w: rw, h: rh },
  ];
}

function drawPhotoCover(ctx, img, rect, zoom, dx, dy) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * (zoom || 1);
  const pw = img.naturalWidth * s, ph = img.naturalHeight * s;
  const cx = rect.x + rect.w / 2 + (dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (dy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function fitFont(ctx, text, maxW, start, family, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// state: { photos: Image[], panels: [{photo, zoom, dx, dy}...],
//   layout, grade, caption, sub, accentWord }
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRects(state.layout || 'hero', w, h);

  // sky base
  const sky = ctx.createLinearGradient(0, 0, w, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // panels
  const panels = state.panels || [];
  rects.forEach((r, i) => {
    const p = panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = state.photos && state.photos[p.photo] ? state.photos[p.photo] : null;
    if (img) {
      drawPhotoCover(ctx, img, r, p.zoom, p.dx, p.dy);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.fillStyle = grade.tint;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  });

  // sun disc behind the caption band
  const sunR = Math.min(w, h) * 0.16;
  const sx = w * 0.78, sy = h * 0.62;
  const sun = ctx.createRadialGradient(sx, sy, sunR * 0.1, sx, sy, sunR);
  sun.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
  sun.addColorStop(0.6, 'rgba(255, 150, 60, 0.55)');
  sun.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // caption band
  const bandH = h * 0.24;
  const bandY = h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.008));
  // diagonal accent stripe
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bandY, w, bandH);
  ctx.clip();
  ctx.fillStyle = grade.accent;
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.moveTo(w * 0.55, bandY);
  ctx.lineTo(w * 0.75, bandY);
  ctx.lineTo(w * 0.45, h);
  ctx.lineTo(w * 0.25, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const caption = (state.caption || 'VICE CITY').trim().toUpperCase();
  const sub = (state.sub || '').trim();
  const accentWord = (state.accentWord || '').trim();
  const pad = w * 0.05;

  if (accentWord) {
    const aSize = fitFont(ctx, accentWord, w * 0.5, h * 0.055, '"Pacifico", cursive', '400');
    ctx.font = `400 ${aSize}px "Pacifico", cursive`;
    ctx.fillStyle = grade.accent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(accentWord, pad, bandY + h * 0.075);
  }
  const capSize = fitFont(ctx, caption, w - pad * 2, h * 0.105, '"Anton", sans-serif', '400');
  ctx.font = `400 ${capSize}px "Anton", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = capSize * 0.12;
  ctx.shadowOffsetY = capSize * 0.04;
  const capY = bandY + bandH * (accentWord ? 0.72 : 0.62);
  ctx.fillText(caption, pad, capY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (sub) {
    const sSize = fitFont(ctx, sub.toUpperCase(), w - pad * 2, h * 0.032, '"Anton", sans-serif', '400');
    ctx.font = `400 ${sSize}px "Anton", sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub.toUpperCase(), pad, bandY + bandH * 0.92);
  }
}

export function defaultPanels(layout, count) {
  const n = panelRects(layout, 100, 100).length;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ photo: count > 1 ? i % count : 0, zoom: 1, dx: 0, dy: 0 });
  }
  return out;
}
