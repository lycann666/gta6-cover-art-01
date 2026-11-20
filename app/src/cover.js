// Vice City Cover Maker — canvas renderer, written fresh for round 4.
// One photo (or two) becomes GTA-style cover art: comic panels with gutters,
// a colour grade, halftone dots, a giant outlined caption and a script accent.
// No Rockstar art, logos or fonts are used anywhere; the lettering is Anton
// (display) and Pacifico (script), both SIL OFL fonts bundled under app/fonts.

export const LAYOUTS = ['hero', 'duo', 'trio', 'grid'];
export const GRADES = ['sunset', 'neon', 'pastel'];

export const GRADE_STYLE = {
  sunset: {
    overlayTop: 'rgba(255,122,24,0.10)',
    overlayBottom: 'rgba(255,0,110,0.38)',
    accent: ['#ff7a18', '#ff2e88', '#7b2ff7'],
    band: '#160a2e',
    bandTop: '#3d1157',
    underline: '#ffb703',
    accentText: '#ffd166',
    sun: '#ffcf5c',
  },
  neon: {
    overlayTop: 'rgba(0,229,255,0.10)',
    overlayBottom: 'rgba(255,0,229,0.34)',
    accent: ['#00e5ff', '#ff00e5', '#7b2ff7'],
    band: '#0a061f',
    bandTop: '#1c0f4d',
    underline: '#00e5ff',
    accentText: '#7df9ff',
    sun: '#ff5ce1',
  },
  pastel: {
    overlayTop: 'rgba(255,183,213,0.16)',
    overlayBottom: 'rgba(167,139,250,0.30)',
    accent: ['#fbc2eb', '#a6c1ee', '#fda085'],
    band: '#2d1b4e',
    bandTop: '#5b3a8c',
    underline: '#ff8fb3',
    accentText: '#ffe3f1',
    sun: '#fff3b0',
  },
};

const TAG = 'FAN-MADE \u2022 ORIGINAL ART \u2022 NO ROCKSTAR ASSETS';

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws `img` cover-fit into (x, y, w, h), zoomed and panned by `crop`. */
function drawPhoto(ctx, img, x, y, w, h, crop) {
  if (!img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3d2b63');
    g.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const zoom = crop?.zoom ?? 1;
  const dx = crop?.dx ?? 0;
  const dy = crop?.dy ?? 0;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - pw) / 2 + dx * w * 0.2, y + (h - ph) / 2 + dy * h * 0.2, pw, ph);
  ctx.restore();
}

/** A warm/cool colour wash over a photo rect, per grade. */
function gradeWash(ctx, x, y, w, h, style) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, style.overlayTop);
  g.addColorStop(1, style.overlayBottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Halftone dots fading out across a corner of (x, y, w, h). */
function halftone(ctx, x, y, w, h, color) {
  const step = Math.max(14, w / 22);
  ctx.fillStyle = color;
  let row = 0;
  for (let cy = y + step / 2; cy < y + h; cy += step, row++) {
    let col = 0;
    for (let cx = x + step / 2; cx < x + w; cx += step, col++) {
      const fade = 1 - (cx - x) / w - (cy - y) / h * 0.4;
      if (fade <= 0.05) continue;
      const r = Math.max(0.6, step * 0.20 * fade);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A striped retro sun disc, clipped to its circle. */
function stripedSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  let gap = r * 0.16;
  for (let y = cy + r * 0.05; y < cy + r; y += gap) {
    ctx.fillRect(cx - r, y, r * 2, gap * 0.45);
    gap *= 1.35;
  }
  ctx.restore();
}

/** The gradient accent panel: sun + script word, used by duo/trio/grid. */
function accentPanel(ctx, x, y, w, h, style, accent) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, style.accent[0]);
  g.addColorStop(0.55, style.accent[1]);
  g.addColorStop(1, style.accent[2]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w, h) * 0.30;
  stripedSun(ctx, x + w * 0.5, y + h * 0.34, r, style.sun);
  halftone(ctx, x + w * 0.62, y + h * 0.02, w * 0.36, h * 0.42, 'rgba(255,255,255,0.85)');
  const word = (accent || 'Vice City').trim() || 'Vice City';
  ctx.save();
  ctx.translate(x + w / 2, y + h * 0.78);
  ctx.rotate(-0.05);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, word, w * 0.86, Math.min(w * 0.30, h * 0.30), 'Pacifico, cursive', '400');
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = size * 0.25;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(word, 0, 0);
  ctx.restore();
}

/**
 * Renders the cover onto `canvas` at its own size.
 * state: { photoA, photoB, layout, grade, caption, accent,
 *          cropA: {zoom,dx,dy}, cropB: {zoom,dx,dy} }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const s = state || {};
  const style = GRADE_STYLE[s.grade] || GRADE_STYLE.sunset;
  const layout = LAYOUTS.includes(s.layout) ? s.layout : 'hero';
  const gutter = Math.round(Math.max(6, W * 0.008));
  const bandH = Math.round(H * 0.22);
  const topH = H - bandH;

  ctx.fillStyle = style.band;
  ctx.fillRect(0, 0, W, H);

  const photo = (img, x, y, w, h, crop) => {
    drawPhoto(ctx, img, x, y, w, h, crop);
    gradeWash(ctx, x, y, w, h, style);
  };

  if (layout === 'hero') {
    photo(s.photoA, gutter, gutter, W - gutter * 2, topH - gutter, s.cropA);
    halftone(ctx, W * 0.78, gutter + topH * 0.02, W * 0.20, topH * 0.30, 'rgba(255,255,255,0.9)');
  } else if (layout === 'duo') {
    const leftW = Math.round((W - gutter * 3) * 0.62);
    const rightX = gutter * 2 + leftW;
    const rightW = W - gutter - rightX;
    photo(s.photoA, gutter, gutter, leftW, topH - gutter, s.cropA);
    photo(s.photoB, rightX, gutter, rightW, Math.round((topH - gutter) * 0.58), s.cropB);
    accentPanel(ctx, rightX, gutter + Math.round((topH - gutter) * 0.58) + gutter, rightW,
      topH - gutter - Math.round((topH - gutter) * 0.58) - gutter, style, s.accent);
  } else if (layout === 'trio') {
    const leftW = Math.round((W - gutter * 3) * 0.55);
    const rightX = gutter * 2 + leftW;
    const rightW = W - gutter - rightX;
    const halfH = Math.round((topH - gutter) / 2) - Math.round(gutter / 2);
    photo(s.photoA, gutter, gutter, leftW, topH - gutter, s.cropA);
    photo(s.photoB, rightX, gutter, rightW, halfH, s.cropB);
    accentPanel(ctx, rightX, gutter + halfH + gutter, rightW, halfH, style, s.accent);
  } else {
    // grid: 2 x 2 panels above the caption band.
    const halfW = Math.round((W - gutter * 3) / 2);
    const halfH = Math.round((topH - gutter * 2) / 2);
    photo(s.photoA, gutter, gutter, halfW, halfH, s.cropA);
    photo(s.photoB, gutter * 2 + halfW, gutter, halfW, halfH, s.cropB);
    accentPanel(ctx, gutter, gutter * 2 + halfH, halfW, halfH, style, s.accent);
    photo(s.photoA, gutter * 2 + halfW, gutter * 2 + halfH, halfW, halfH,
      { zoom: (s.cropA?.zoom ?? 1) * 1.6, dx: 0, dy: 0.25 });
    halftone(ctx, gutter * 2 + halfW + halfW * 0.68, gutter * 2 + halfH + halfH * 0.05,
      halfW * 0.30, halfH * 0.4, 'rgba(255,255,255,0.9)');
  }

  // Caption band: gradient, giant outlined caption, script accent, tag line.
  const bandY = topH;
  const bg = ctx.createLinearGradient(0, bandY, 0, H);
  bg.addColorStop(0, style.bandTop);
  bg.addColorStop(1, style.band);
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = style.underline;
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));

  const caption = (s.caption || 'Sunset Heist').trim().toUpperCase() || 'SUNSET HEIST';
  const pad = W * 0.04;
  const accent = (s.accent || 'Vice City').trim() || 'Vice City';
  // Reserve the band's right-hand third for the script accent so a long
  // caption can never run underneath it (portrait covers are the tight case).
  const captionMaxW = accent ? W - pad * 2 - W * 0.30 : W - pad * 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const capSize = fitFont(ctx, caption, captionMaxW, bandH * 0.52, 'Anton, sans-serif', '400');
  const capY = bandY + bandH * 0.62;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, capSize * 0.14);
  ctx.strokeStyle = '#14061f';
  ctx.strokeText(caption, pad, capY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(caption, pad, capY);
  // Underline bar under the caption, as wide as the caption itself.
  const capW = ctx.measureText(caption).width;
  ctx.fillStyle = style.underline;
  ctx.fillRect(pad, capY + bandH * 0.06, Math.min(capW, W - pad * 2), Math.max(3, bandH * 0.045));

  ctx.save();
  ctx.translate(W - pad, bandY + bandH * 0.30);
  ctx.rotate(-0.06);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const accSize = fitFont(ctx, accent, W * 0.28, bandH * 0.30, 'Pacifico, cursive', '400');
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = accSize * 0.2;
  ctx.fillStyle = style.accentText;
  ctx.fillText(accent, 0, 0);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const tagSize = fitFont(ctx, TAG, W * 0.6, Math.max(11, bandH * 0.115), 'Anton, sans-serif', '400');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(TAG, pad, H - bandH * 0.10);
}
