// Vice City Cover Maker — the drawing engine. Everything here is drawn by hand on
// canvas: the multi-panel layouts, the colour grades, the retro slatted sun, the palm
// silhouettes, the skyline and the halftone title block. No game artwork, no game fonts.

export const LAYOUTS = {
  grid: { label: 'Four-panel grid', panels: 4 },
  hero: { label: 'Hero + three', panels: 4 },
  full: { label: 'Full-bleed single', panels: 1 },
  tilted: { label: 'Tilted snapshots', panels: 3 },
};

export const GRADES = {
  sunset: {
    label: 'Vice City sunset',
    sky: ['#2b0f54', '#b83280', '#ff7b3d', '#ff2e88'],
    sun: ['#ffe66d', '#ff9a3d', '#ff2e88'],
    band: '#170a2e', bandEdge: '#ff2e88',
    title: '#fff7ec', subtitle: '#ffd166', accent: '#2de2c5',
    photoTint: 'rgba(255, 46, 136, 0.10)', frame: '#fff7ec',
    silhouette: '#1c0b33', halftone: '#ff5ea8',
  },
  neon: {
    label: 'Neon nights',
    sky: ['#05081f', '#1b0f54', '#3d1a8a', '#7b2fff'],
    sun: ['#2de2c5', '#7b2fff', '#ff5ea8'],
    band: '#070a24', bandEdge: '#2de2c5',
    title: '#eafffb', subtitle: '#2de2c5', accent: '#ff5ea8',
    photoTint: 'rgba(123, 47, 255, 0.14)', frame: '#eafffb',
    silhouette: '#0a0620', halftone: '#2de2c5',
  },
  noir: {
    label: 'Palm noir',
    sky: ['#0a0a0a', '#232323', '#4a4a4a', '#8a8a8a'],
    sun: ['#ffffff', '#d9d9d9', '#8a8a8a'],
    band: '#0a0a0a', bandEdge: '#f5f5f5',
    title: '#ffffff', subtitle: '#d9d9d9', accent: '#ff5ea8',
    photoTint: 'rgba(0, 0, 0, 0.18)', frame: '#ffffff',
    silhouette: '#000000', halftone: '#ffffff',
  },
  pastel: {
    label: 'Pastel Vice',
    sky: ['#a8e6ff', '#ffd6ec', '#ffc4d6', '#ffb347'],
    sun: ['#fff3b0', '#ffd6ec', '#ff9ecf'],
    band: '#3a1d63', bandEdge: '#ff9ecf',
    title: '#fff7ec', subtitle: '#a8e6ff', accent: '#ff5ea8',
    photoTint: 'rgba(255, 158, 207, 0.10)', frame: '#fff7ec',
    silhouette: '#4a2d72', halftone: '#a8e6ff',
  },
};

/** Panel rectangles for a layout inside the photo area (x, y, w, h, rotation in radians). */
export function panelRects(layout, area) {
  const g = Math.max(10, area.w * 0.014); // gap between panels
  const { x, y, w, h } = area;
  if (layout === 'grid') {
    const cw = (w - g) / 2, ch = (h - g) / 2;
    return [
      { x, y, w: cw, h: ch, rot: 0 },
      { x: x + cw + g, y, w: cw, h: ch, rot: 0 },
      { x, y: y + ch + g, w: cw, h: ch, rot: 0 },
      { x: x + cw + g, y: y + ch + g, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'hero') {
    const heroW = w * 0.62, sideW = w - heroW - g, sh = (h - 2 * g) / 3;
    return [
      { x, y, w: heroW, h, rot: 0 },
      { x: x + heroW + g, y, w: sideW, h: sh, rot: 0 },
      { x: x + heroW + g, y: y + sh + g, w: sideW, h: sh, rot: 0 },
      { x: x + heroW + g, y: y + 2 * (sh + g), w: sideW, h: sh, rot: 0 },
    ];
  }
  if (layout === 'full') return [{ x, y, w, h, rot: 0 }];
  // tilted: three overlapping snapshots, fanned out like photos tossed on a table
  const pw = w * 0.42, ph = h * 0.78, cy = y + (h - ph) / 2;
  return [
    { x: x + w * 0.02, y: cy + h * 0.04, w: pw, h: ph, rot: -0.10 },
    { x: x + (w - pw) / 2, y: cy - h * 0.03, w: pw, h: ph, rot: 0.02 },
    { x: x + w * 0.56, y: cy + h * 0.04, w: pw, h: ph, rot: 0.10 },
  ];
}

/** A retro sun: a glowing disc with horizontal slats cut out of its lower half. */
export function drawSlattedSun(ctx, cx, cy, r, colors, barColor = '#241040') {
  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, colors[0]); grad.addColorStop(0.55, colors[1]); grad.addColorStop(1, colors[2]);
  ctx.save();
  ctx.shadowColor = colors[2]; ctx.shadowBlur = r * 0.45;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Slats: sky-coloured bars across the lower half, widening toward the bottom.
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(20, 8, 40, 0.0)';
  const sky = ctx.createLinearGradient(cx, cy, cx, cy + r);
  sky.addColorStop(0, 'rgba(43, 15, 84, 0)'); sky.addColorStop(1, 'rgba(43, 15, 84, 0.0)');
  let yy = cy + r * 0.08, gap = r * 0.045, bar = r * 0.05;
  while (yy < cy + r) {
    ctx.fillStyle = barColor;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(cx - r, yy, r * 2, bar);
    yy += bar + gap; bar *= 1.35; gap *= 1.25;
  }
  ctx.restore();
}

/** A palm-tree silhouette: a curved trunk and six drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  // Trunk: one smooth curve leaning right.
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -70, 30, -128); ctx.stroke();
  const topX = 30, topY = -128;
  // Fronds: single smooth arcs from the crown, drooping outward and down.
  const fronds = [
    [-150, -30, -185, 55], [-110, -75, -165, -15], [-55, -95, -95, -55],
    [150, -30, 185, 55], [110, -75, 168, -12], [55, -95, 98, -52],
    [-10, -105, -30, -60], [18, -102, 55, -70],
  ];
  ctx.lineWidth = 9;
  for (const [cx, cy, ex, ey] of fronds) {
    ctx.beginPath(); ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + cx, topY + cy, topX + ex, topY + ey);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(topX, topY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** A city skyline: blocky towers with a few lit windows, drawn along a baseline. */
export function drawSkyline(ctx, x, yBase, w, h, color, lit) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(bx, yBase - bh, bw, bh);
    if (rnd() > 0.5) ctx.fillRect(bx + bw * 0.3, yBase - bh - h * 0.12, bw * 0.4, h * 0.12); // antenna block
    ctx.fillStyle = lit;
    for (let wy = yBase - bh + 8; wy < yBase - 8; wy += 14) {
      for (let wx = bx + 6; wx < bx + bw - 6; wx += 12) {
        if (rnd() > 0.72) ctx.fillRect(wx, wy, 5, 7);
      }
    }
    ctx.fillStyle = color;
    bx += bw + w * 0.012;
  }
  ctx.restore();
}

/** Halftone dots that shrink toward one edge — the classic poster title texture. */
export function drawHalftone(ctx, x, y, w, h, color, maxR) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, maxR * 2.4);
  for (let yy = y; yy < y + h; yy += step) {
    const t = (yy - y) / h; // 0 at top, 1 at bottom
    for (let xx = x; xx < x + w; xx += step) {
      const r = maxR * (0.25 + 0.75 * t);
      ctx.globalAlpha = 0.16 + 0.5 * t;
      ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPhotoInto(ctx, img, rect, crop, tint) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const zoom = crop?.zoom ?? 1.2;
    const base = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * base, dh = ih * base;
    const dx = x + (w - dw) / 2 + ((crop?.panX ?? 0) / 100) * w * 0.3;
    const dy = y + (h - dh) / 2 + ((crop?.panY ?? 0) / 100) * h * 0.3;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#5b2a86'); g.addColorStop(1, '#ff2e88');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('YOUR PHOTO HERE', x + w / 2, y + h / 2);
  }
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { photos, crops, layout, grade, title, subtitle, showSun, showPalms, showSkyline }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const s = W / 1080; // scale factor so the design holds at every export size

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Photo area sits above the title band.
  const bandH = H * (state.layout === 'full' ? 0.30 : 0.27);
  const area = { x: W * 0.03, y: H * 0.03, w: W * 0.94, h: H - bandH - H * 0.055 };

  // Retro sun, peeking from behind the panels.
  if (state.showSun) {
    drawSlattedSun(ctx, W * 0.78, area.y + area.h * 0.42, Math.min(W, H) * 0.17, grade.sun);
  }

  // Panels.
  const rects = panelRects(state.layout, area);
  rects.forEach((rect, i) => {
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPhotoInto(ctx, state.photos[i] || null, { x: 0, y: 0, w: rect.w, h: rect.h }, state.crops[i], grade.photoTint);
      ctx.strokeStyle = grade.frame; ctx.lineWidth = Math.max(4, 6 * s);
      ctx.strokeRect(3, 3, rect.w - 6, rect.h - 6);
      ctx.restore();
    } else {
      drawPhotoInto(ctx, state.photos[i] || null, rect, state.crops[i], grade.photoTint);
      ctx.strokeStyle = grade.frame; ctx.lineWidth = Math.max(4, 6 * s);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    // Soft drop shadow under each panel.
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(3, 5 * s);
    ctx.strokeRect(rect.x + 4 * s, rect.y + 5 * s, rect.w, rect.h);
    ctx.restore();
  });

  // Skyline strip across the bottom of the photo area, then palms framing
  // the corners in front of it (trunks rising from the strip's base).
  if (state.showPalms) {
    drawPalm(ctx, area.x + W * 0.02, area.y + area.h * 0.99, 0.85 * s, grade.silhouette);
    drawPalm(ctx, area.x + area.w - W * 0.02, area.y + area.h * 0.99, 0.75 * s, grade.silhouette);
  }
  if (state.showSkyline) {
    drawSkyline(ctx, area.x, area.y + area.h, area.w, H * 0.085, grade.silhouette, grade.accent);
  }

  // Title band with halftone texture, and a second slatted sun rising in the
  // band's right side so the motif is visible in every layout.
  const bandY = H - bandH;
  ctx.fillStyle = grade.band; ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = grade.bandEdge; ctx.fillRect(0, bandY, W, Math.max(4, 6 * s));
  if (state.showSun) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, bandY, W, bandH); ctx.clip();
    ctx.globalAlpha = 0.9;
    drawSlattedSun(ctx, W * 0.84, bandY + bandH * 0.62, bandH * 0.58, grade.sun, grade.band);
    ctx.restore();
  }
  drawHalftone(ctx, W * 0.62, bandY + bandH * 0.12, W * 0.36, bandH * 0.76, grade.halftone, 7 * s);

  // Title in bold display lettering, subtitle in script.
  const title = (state.title || 'VICE CITY').toUpperCase();
  const titleSize = Math.min(bandH * 0.52, (W * 0.9) / Math.max(4, title.length * 0.62));
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `${Math.round(titleSize)}px Anton, 'Arial Black', sans-serif`;
  ctx.save();
  ctx.shadowColor = grade.bandEdge; ctx.shadowBlur = 18 * s; ctx.shadowOffsetY = 4 * s;
  ctx.fillStyle = grade.title;
  ctx.fillText(title, W * 0.045, bandY + bandH * 0.56);
  ctx.restore();
  ctx.font = `${Math.round(bandH * 0.24)}px Pacifico, cursive`;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(state.subtitle || '', W * 0.05, bandY + bandH * 0.88);
  // Small accent rule under the title.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(W * 0.045, bandY + bandH * 0.66, W * 0.22, Math.max(3, 4 * s));
}
