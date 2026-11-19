// Vice Cover Studio — the cover renderer.
// Everything on the poster is drawn here with plain Canvas 2D: the photo
// panels, the sunset/neon colour grades, the retro sun, the palm silhouettes,
// the skyline, the halftone title block and the big display caption.
// No Rockstar logo, artwork or font is used anywhere: the lettering is set
// in Anton and Pacifico (SIL Open Font License, shipped under app/fonts/).

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080 · Square', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350 · Portrait', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080 · Wide', w: 1920, h: 1080 },
];

export const LAYOUTS = [
  { id: 'hero', name: 'Hero + 3', panels: 4 },
  { id: 'grid', name: 'Grid 4', panels: 4 },
  { id: 'full', name: 'Full-bleed', panels: 1 },
  { id: 'nine', name: 'Nine', panels: 9 },
];

export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff5e7a', '#7b2fbe'], wash: '#ff7a3d', accent: '#ffd166',
    sun: '#ffe9a3', title: '#ffffff', sub: '#ffd166',
  },
  {
    id: 'neon', name: 'Neon Night',
    sky: ['#00e5ff', '#b537f2', '#ff2e88'], wash: '#2e6bff', accent: '#39ffce',
    sun: '#ff9de2', title: '#ffffff', sub: '#39ffce',
  },
  {
    id: 'palm', name: 'Palm Dusk',
    sky: ['#ffb347', '#e85d75', '#3d348b'], wash: '#e85d75', accent: '#ffe66d',
    sun: '#fff3b0', title: '#fff8e7', sub: '#ffe66d',
  },
  {
    id: 'noir', name: 'Noir',
    sky: ['#8d99ae', '#2b2d42', '#0d0d1a'], wash: '#5a6b8a', accent: '#f4f4f4',
    sun: '#e8e8e8', title: '#ffffff', sub: '#c9c9c9',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rectangles for a layout, with poster gutters.
export function panelRects(layoutId, W, H) {
  const g = Math.round(Math.min(W, H) * 0.018); // gutter
  const m = Math.round(Math.min(W, H) * 0.028); // outer margin
  const inner = { x: m, y: m, w: W - m * 2, h: H - m * 2 };
  if (layoutId === 'full') return [{ ...inner }];
  if (layoutId === 'grid') {
    const cw = (inner.w - g) / 2, ch = (inner.h - g) / 2;
    return [
      { x: inner.x, y: inner.y, w: cw, h: ch },
      { x: inner.x + cw + g, y: inner.y, w: cw, h: ch },
      { x: inner.x, y: inner.y + ch + g, w: cw, h: ch },
      { x: inner.x + cw + g, y: inner.y + ch + g, w: cw, h: ch },
    ];
  }
  if (layoutId === 'nine') {
    const cw = (inner.w - g * 2) / 3, ch = (inner.h - g * 2) / 3;
    const out = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        out.push({ x: inner.x + c * (cw + g), y: inner.y + r * (ch + g), w: cw, h: ch });
    return out;
  }
  // hero: one big panel left, three stacked on the right.
  const heroW = inner.w * 0.62;
  const sideW = inner.w - heroW - g;
  const sh = (inner.h - g * 2) / 3;
  return [
    { x: inner.x, y: inner.y, w: heroW, h: inner.h },
    { x: inner.x + heroW + g, y: inner.y, w: sideW, h: sh },
    { x: inner.x + heroW + g, y: inner.y + sh + g, w: sideW, h: sh },
    { x: inner.x + heroW + g, y: inner.y + (sh + g) * 2, w: sideW, h: sh },
  ];
}

function coverFit(img, rect, crop) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (crop?.zoom || 1);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  const cx = (crop?.x || 0) * (dw - rect.w) * 0.5;
  const cy = (crop?.y || 0) * (dh - rect.h) * 0.5;
  return { x: rect.x + (rect.w - dw) / 2 - cx, y: rect.y + (rect.h - dh) / 2 - cy, w: dw, h: dh };
}

function roundRectPath(ctx, r) {
  const rad = Math.min(10, r.w * 0.02, r.h * 0.02);
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.lineTo(r.x + r.w - rad, r.y);
  ctx.quadraticCurveTo(r.x + r.w, r.y, r.x + r.w, r.y + rad);
  ctx.lineTo(r.x + r.w, r.y + r.h - rad);
  ctx.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - rad, r.y + r.h);
  ctx.lineTo(r.x + rad, r.y + r.h);
  ctx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - rad);
  ctx.lineTo(r.x, r.y + rad);
  ctx.quadraticCurveTo(r.x, r.y, r.x + rad, r.y);
  ctx.closePath();
}

function drawPhotoPanel(ctx, img, rect, crop, grade, motif) {
  ctx.save();
  roundRectPath(ctx, rect);
  ctx.clip();
  if (img) {
    const d = coverFit(img, rect, crop);
    ctx.drawImage(img, d.x, d.y, d.w, d.h);
  } else {
    const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // Colour grade: a warm wash in overlay, then the sky gradient in
  // soft-light so photos take on the sunset / neon mood.
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.34;
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  wash.addColorStop(0, grade.sky[0]);
  wash.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Motifs live inside the panel so the poster feels illustrated, not flat.
  if (motif === 'sun') drawRetroSun(ctx, rect, grade);
  if (motif === 'palms') drawPalms(ctx, rect, grade);
  if (motif === 'skyline') drawSkyline(ctx, rect, grade);
  ctx.restore();
  // Poster frame around every panel.
  ctx.save();
  roundRectPath(ctx, rect);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.stroke();
  ctx.restore();
}

function drawRetroSun(ctx, rect, grade) {
  const r = Math.min(rect.w, rect.h) * 0.17;
  const cx = rect.x + rect.w * 0.78;
  const cy = rect.y + rect.h * 0.26;
  ctx.save();
  ctx.globalAlpha = 0.9;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#fff6c9');
  disc.addColorStop(0.5, grade.sun);
  disc.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = disc;
  ctx.fill();
  // Retro slats cut across the lower half of the disc.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.12 + i * 0.24);
    ctx.fillRect(cx - r, y, r * 2, r * 0.04 * (1 + i * 0.5));
  }
  ctx.restore();
}

function drawPalms(ctx, rect, grade) {
  const s = Math.min(rect.w, rect.h);
  const baseX = rect.x + rect.w * 0.1;
  const baseY = rect.y + rect.h * 0.99;
  const h = s * 0.85;
  ctx.save();
  ctx.fillStyle = 'rgba(20,8,32,0.92)';
  ctx.strokeStyle = 'rgba(20,8,32,0.92)';
  ctx.lineCap = 'round';
  // Trunk, leaning gently, drawn thick so it reads at small sizes.
  ctx.lineWidth = s * 0.035;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + s * 0.06, baseY - h * 0.6, baseX + s * 0.14, baseY - h);
  ctx.stroke();
  const topX = baseX + s * 0.14, topY = baseY - h;
  // Seven fronds, each one filled blade that tapers to a tip: a bold
  // silhouette that still reads as a palm when the panel is small.
  for (let i = 0; i < 7; i++) {
    const a = (-165 + i * 27) * (Math.PI / 180);
    const len = s * (0.3 + (i % 3) * 0.04);
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len * 0.7 + len * 0.3;
    const ctrlX = topX + Math.cos(a) * len * 0.55;
    const ctrlY = topY + Math.sin(a) * len * 0.55 - len * 0.14;
    const perp = a + Math.PI / 2;
    const wdt = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(topX + Math.cos(perp) * wdt, topY + Math.sin(perp) * wdt);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX + Math.cos(perp) * wdt * 0.4, ctrlY + Math.sin(perp) * wdt * 0.4, topX - Math.cos(perp) * wdt, topY - Math.sin(perp) * wdt);
    ctx.closePath();
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - s * 0.014, topY + s * 0.014, s * 0.02, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.018, topY + s * 0.022, s * 0.017, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx, rect, grade) {
  const rnd = mulberry32(20261119);
  const baseY = rect.y + rect.h;
  ctx.save();
  ctx.fillStyle = 'rgba(16,6,28,0.88)';
  let x = rect.x;
  while (x < rect.x + rect.w) {
    const bw = rect.w * (0.08 + rnd() * 0.1);
    const bh = rect.h * (0.18 + rnd() * 0.3);
    ctx.fillRect(x, baseY - bh, bw, bh);
    // Lit windows.
    ctx.fillStyle = grade.accent;
    ctx.globalAlpha = 0.85;
    for (let wy = baseY - bh + 6; wy < baseY - 8; wy += Math.max(10, rect.h * 0.045)) {
      for (let wx = x + 5; wx < x + bw - 6; wx += Math.max(10, rect.w * 0.05)) {
        if (rnd() > 0.55) ctx.fillRect(wx, wy, 3, 4);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(16,6,28,0.88)';
    x += bw + rect.w * 0.015;
  }
  ctx.restore();
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrain(ctx, W, H) {
  const size = 140;
  const tile = document.createElement('canvas');
  tile.width = size; tile.height = size;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(size, size);
  const rnd = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  tctx.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H * 0.42, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, W, H, state, grade) {
  const title = (state.title || 'VICE SUNSET').toUpperCase();
  const sub = state.subtitle || 'a vice city story';
  const blockH = H * (state.layout === 'full' ? 0.3 : 0.24);
  const by = H - blockH;
  // Halftone dot strip behind the lettering.
  ctx.save();
  const strip = ctx.createLinearGradient(0, by, 0, H);
  strip.addColorStop(0, 'rgba(12,2,24,0.12)');
  strip.addColorStop(1, 'rgba(12,2,24,0.88)');
  ctx.fillStyle = strip;
  ctx.fillRect(0, by, W, blockH);
  ctx.fillStyle = grade.accent;
  ctx.globalAlpha = 0.28;
  const gap = Math.max(14, W * 0.012);
  for (let y = by + gap * 0.7; y < H - 4; y += gap) {
    for (let x = gap * 0.6; x < W; x += gap) {
      const r = 1.6 + ((x + y) % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // Big display title with a magenta offset shadow and a dark outline.
  const pad = W * 0.045;
  const titlePx = fitFont(ctx, title, W - pad * 2, H * 0.115, 'Anton, sans-serif', 400);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const titleY = H - blockH * 0.34;
  ctx.font = `400 ${titlePx}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(12,2,24,0.95)';
  ctx.lineWidth = Math.max(3, titlePx * 0.09);
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(title, pad + titlePx * 0.045, titleY + titlePx * 0.045);
  ctx.fillStyle = grade.title;
  ctx.fillText(title, pad, titleY);
  // Script subtitle tucked under the title, plus a small tag line.
  const subPx = fitFont(ctx, sub, W * 0.62, H * 0.048, 'Pacifico, cursive', 400);
  ctx.font = `400 ${subPx}px Pacifico, cursive`;
  ctx.fillStyle = grade.sub;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(sub, pad + 4, H - blockH * 0.08);
  ctx.shadowBlur = 0;
  ctx.font = `400 ${Math.max(13, H * 0.016)}px Anton, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('VICE CITY · EST. 2026', W - pad, H - blockH * 0.1);
  ctx.restore();
}

// The whole poster: panels, grades, motifs, grain, vignette, title block.
export function drawCover(ctx, W, H, state) {
  const grade = gradeById(state.grade);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14061f';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  const motifFor = (i) => {
    if (state.layout === 'full') return state.motif || 'sun';
    if (i === 0) return state.motif || 'sun';
    if (i === 1 && state.layout !== 'nine') return 'palms';
    if (i === 2 && state.layout === 'grid') return 'skyline';
    return 'none';
  };
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, crop: { x: 0, y: 0, zoom: 1 } };
    const img = state.photos[panel.photo]?.img || null;
    drawPhotoPanel(ctx, img, rect, panel.crop, grade, motifFor(i));
  });
  drawGrain(ctx, W, H);
  drawVignette(ctx, W, H);
  drawTitleBlock(ctx, W, H, state, grade);
}

// Renders the poster at export size and returns a PNG data URL.
export function exportCoverPng(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, state);
  return { dataUrl: canvas.toDataURL('image/png'), w: size.w, h: size.h };
}
