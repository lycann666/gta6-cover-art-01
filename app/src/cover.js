// Poster drawing for Vice Cover: multi-panel layouts, colour grades, bold
// caption lettering. Everything is drawn on one canvas at its own size, so
// the live preview and the exported PNG are the same picture.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#ff9e2c', '#ff5e62', '#8f1d6e'],
    tint: 'rgba(255, 80, 120, 0.30)',
    accent: '#ffd166',
    band: 'rgba(22, 4, 34, 0.88)',
    caption: '#fff7e6',
    sub: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b1035', '#3b0f6e', '#00b3c8'],
    tint: 'rgba(0, 229, 255, 0.22)',
    accent: '#00e5ff',
    band: 'rgba(4, 8, 32, 0.88)',
    caption: '#ffffff',
    sub: '#00e5ff',
  },
  day: {
    label: 'Palm Day',
    sky: ['#8fd8ff', '#ffe9a8', '#ff9e6b'],
    tint: 'rgba(255, 200, 90, 0.20)',
    accent: '#ff5e62',
    band: 'rgba(8, 40, 52, 0.86)',
    caption: '#ffffff',
    sub: '#ffe9a8',
  },
};

export const LAYOUTS = {
  hero: {
    label: 'Hero + sides',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  grid: {
    label: 'Four grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  full: {
    label: 'Full bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

export function defaultPanels() {
  return [
    { src: 'a', zoom: 1, dx: 0, dy: 0 },
    { src: 'b', zoom: 1, dx: 0, dy: 0 },
    { src: 'a', zoom: 1.15, dx: 0, dy: 0 },
    { src: 'b', zoom: 1.15, dx: 0, dy: 0 },
  ];
}

function drawPhotoInto(ctx, img, rx, ry, rw, rh, zoom, dx, dy) {
  const base = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
  const scale = base * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rx + rw / 2 + dx * rw;
  const cy = ry + rh / 2 + dy * rh;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
}

function drawPlaceholder(ctx, rx, ry, rw, rh, grade, label) {
  const g = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, rw * 0.01);
  for (let i = -rh; i < rw; i += rw * 0.14) {
    ctx.beginPath();
    ctx.moveTo(rx + i, ry + rh);
    ctx.lineTo(rx + i + rh, ry);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.max(14, rw * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(label, rx + rw / 2, ry + rh / 2);
}

function fitFont(ctx, text, maxWidth, start, family, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws the whole poster onto `canvas` from `state`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;
  const gut = Math.max(4, Math.round(w * 0.006));

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((p, i) => {
    const rx = p.x * w + (p.x > 0 ? gut / 2 : 0);
    const ry = p.y * h + (p.y > 0 ? gut / 2 : 0);
    const rw = p.w * w - (p.x > 0 ? gut / 2 : 0) - (p.x + p.w < 1 ? gut / 2 : 0);
    const rh = p.h * h - (p.y > 0 ? gut / 2 : 0) - (p.y + p.h < 1 ? gut / 2 : 0);
    const cfg = state.panels[i] ?? { src: 'a', zoom: 1, dx: 0, dy: 0 };
    const img = cfg.src === 'b' ? state.photos.b : state.photos.a;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    if (img) {
      drawPhotoInto(ctx, img, rx, ry, rw, rh, cfg.zoom, cfg.dx, cfg.dy);
    } else {
      drawPlaceholder(ctx, rx, ry, rw, rh, grade, 'ADD PHOTO');
    }
    const tint = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    tint.addColorStop(0, 'rgba(0,0,0,0)');
    tint.addColorStop(1, grade.tint);
    ctx.fillStyle = tint;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, gut * 0.6);
    ctx.strokeRect(rx, ry, rw, rh);
  });

  // Sun disc over the first panel, poster style.
  const sunR = Math.min(w, h) * 0.085;
  const sunX = w * (state.layout === 'full' ? 0.82 : 0.5);
  const sunY = h * 0.13;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Caption band across the foot.
  const bandH = h * 0.24;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(0.45, grade.band);
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const caption = (state.caption || '').trim().toUpperCase();
  if (caption) {
    const size = fitFont(ctx, caption, w * 0.92, h * 0.115, '"Anton", sans-serif', 400);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,2,20,0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.fillStyle = grade.caption;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    const cy = h - h * 0.085;
    ctx.strokeText(caption, w / 2, cy);
    ctx.fillText(caption, w / 2, cy);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  const sub = (state.sub || '').trim();
  if (sub) {
    const size = fitFont(ctx, sub, w * 0.8, h * 0.045, '"Pacifico", cursive', 400);
    ctx.textAlign = 'center';
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(sub, w / 2, h - h * 0.028);
    ctx.shadowBlur = 0;
  }
}
