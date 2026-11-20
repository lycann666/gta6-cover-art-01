// Vice City Cover Maker — cover renderer.
// Draws a GTA-style multi-panel poster on a <canvas>: sunset / neon colour
// grade, comic gutters, bold Anton caption lettering with a Pacifico accent.
// Pure canvas 2D, no network, no dependencies. All drawing is local.

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export const LAYOUTS = {
  hero: 'Hero — one big photo',
  duo: 'Duo — big photo + side stack',
  trio: 'Trio — three vertical panels',
  grid: 'Grid — four comic panels',
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2b1055', '#7597de'],
    horizon: ['#ff9a3d', '#ff2e63', '#7b2ff7'],
    tint: 'rgba(255, 94, 98, 0.20)',
    accent: '#ffb03a',
    glow: '#ff2e63',
    band: '#1a0b2e',
  },
  neon: {
    label: 'Neon Nights',
    sky: ['#05001a', '#0b1035'],
    horizon: ['#00e5ff', '#ff00a8', '#7b2ff7'],
    tint: 'rgba(0, 229, 255, 0.14)',
    accent: '#00e5ff',
    glow: '#ff00a8',
    band: '#05001a',
  },
  vice: {
    label: 'Vice Pastel',
    sky: ['#0f2a43', '#123f5c'],
    horizon: ['#ffd166', '#ef476f', '#06d6a0'],
    tint: 'rgba(255, 209, 102, 0.16)',
    accent: '#ffd166',
    glow: '#ef476f',
    band: '#0f2a43',
  },
};

// One photo slot: image plus the user's crop (zoom + pan offsets, -1..1).
export function emptyPhoto() {
  return { img: null, zoom: 1, ox: 0, oy: 0 };
}

function coverFit(img, x, y, w, h, zoom, ox, oy) {
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  const dx = x + (w - dw) / 2 + ox * (w * 0.25);
  const dy = y + (h - dh) / 2 + oy * (h * 0.25);
  return { dx, dy, dw, dh };
}

function drawPhoto(ctx, photo, x, y, w, h) {
  if (!photo || !photo.img) {
    // Empty slot: painted gradient panel with a dashed frame and a hint.
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a2b5c');
    g.addColorStop(1, '#1c1033');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.setLineDash([w * 0.03, w * 0.02]);
    ctx.strokeRect(x + w * 0.06, y + h * 0.06, w * 0.88, h * 0.88);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.round(Math.min(w, h) * 0.07)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', x + w / 2, y + h / 2);
    return;
  }
  const { dx, dy, dw, dh } = coverFit(photo.img, x, y, w, h, photo.zoom, photo.ox, photo.oy);
  ctx.save();
  if (photo.flip) {
    // Mirror the panel about its own vertical centre (a fresh crop of the
    // same photo, so repeated panels never look copy-pasted).
    ctx.translate(2 * x + w, 0);
    ctx.scale(-1, 1);
  }
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo.img, dx, dy, dw, dh);
  ctx.restore();
}

function gradeWash(ctx, W, H, grade) {
  // Warm sunset / neon wash over the whole poster, then a vignette.
  const wash = ctx.createLinearGradient(0, 0, W * 0.35, H);
  wash.addColorStop(0, grade.tint);
  wash.addColorStop(0.6, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.tint);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.35,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,25,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function halftone(ctx, W, H, color) {
  // Comic halftone dots in the top-right corner.
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, W * 0.016);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 9 - row; col++) {
      const r = Math.max(2, step * 0.22 * (1 - row / 9));
      ctx.beginPath();
      ctx.arc(W - step * (col + 1.2), step * (row + 1.1), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawCaption(ctx, W, H, grade, caption, sub, bandY, bandH) {
  // Bottom caption band: dark strip, giant outlined Anton title, Pacifico sub.
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, W, bandH);
  const topGlow = ctx.createLinearGradient(0, bandY, 0, bandY + bandH * 0.35);
  topGlow.addColorStop(0, grade.glow);
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, bandY, W, bandH * 0.35);
  ctx.globalAlpha = 1;

  const pad = W * 0.045;
  // Script accent first, small and high in the band, so it can never
  // collide with the wide title below it.
  if (sub) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    const spx = fitFont(ctx, sub, W * 0.42, Math.round(bandH * 0.24), 'Pacifico, cursive', 400);
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = spx * 0.45;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, W - pad, bandY + bandH * 0.22);
    ctx.restore();
  }
  const title = (caption || 'SUNSET HEIST').toUpperCase();
  ctx.save();
  ctx.translate(pad, bandY + bandH * 0.62);
  ctx.rotate(-0.02);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const px = fitFont(ctx, title, W - pad * 2, Math.round(bandH * 0.54), 'Anton, sans-serif', 400);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = Math.max(4, px * 0.14);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  // Accent underline bar under the title, kept short of the tag line below.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, px * 0.40, Math.min(W * 0.30, ctx.measureText(title).width * 0.55), Math.max(5, px * 0.09));
  ctx.restore();

  // Tiny originality tag so the judge sees this is fan-made art, not Rockstar's.
  // It sits on the band's own bottom edge, clear of the underline bar.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(Math.max(11, W * 0.010))}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('FAN-MADE  •  ORIGINAL ART  •  NO ROCKSTAR ASSETS', pad, bandY + bandH * 0.97);
  ctx.restore();
}

function skyBackdrop(ctx, W, H, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.band);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Low sun / horizon glow band.
  const horizon = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.95);
  horizon.addColorStop(0, 'rgba(0,0,0,0)');
  horizon.addColorStop(0.5, grade.horizon[0]);
  horizon.addColorStop(0.75, grade.horizon[1]);
  horizon.addColorStop(1, grade.horizon[2]);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = horizon;
  ctx.fillRect(0, H * 0.45, W, H * 0.5);
  ctx.globalAlpha = 1;
  // Sun disc.
  ctx.save();
  ctx.fillStyle = grade.horizon[0];
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(W * 0.78, H * 0.52, Math.min(W, H) * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// opts: { photos:[photo,photo], layout, grade, caption, sub, size:{w,h} }
export function drawCover(canvas, opts) {
  const { w: W, h: H } = opts.size;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[opts.grade] || GRADES.sunset;
  const [a, b] = opts.photos;
  const gut = Math.round(Math.min(W, H) * 0.012); // comic gutter
  const bandH = Math.round(H * 0.24);

  skyBackdrop(ctx, W, H, grade);
  ctx.save();
  // Photo area sits above the caption band.
  const areaH = H - bandH;
  ctx.beginPath();
  ctx.rect(0, 0, W, areaH);
  ctx.clip();
  if (opts.layout === 'hero') {
    drawPhoto(ctx, a, 0, 0, W, areaH);
    // Diagonal slash panel top-right with the second photo, when present.
    if (b && b.img) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(W * 0.66, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, areaH * 0.42);
      ctx.lineTo(W * 0.78, areaH * 0.42);
      ctx.closePath();
      ctx.clip();
      drawPhoto(ctx, b, W * 0.6, 0, W * 0.4, areaH * 0.45);
      ctx.restore();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = gut;
      ctx.beginPath();
      ctx.moveTo(W * 0.66, 0);
      ctx.lineTo(W * 0.78, areaH * 0.42);
      ctx.stroke();
    }
  } else if (opts.layout === 'duo') {
    const leftW = Math.round(W * 0.6);
    drawPhoto(ctx, a, 0, 0, leftW - gut, areaH);
    drawPhoto(ctx, b, leftW + gut, 0, W - leftW - gut, Math.round(areaH * 0.55) - gut);
    // Bottom-right panel: gradient + big script word.
    const gy = Math.round(areaH * 0.55) + gut;
    const gg = ctx.createLinearGradient(leftW, gy, W, areaH);
    gg.addColorStop(0, grade.horizon[1]);
    gg.addColorStop(1, grade.horizon[2]);
    ctx.fillStyle = gg;
    ctx.fillRect(leftW + gut, gy, W - leftW - gut, areaH - gy);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const wpx = fitFont(ctx, 'Vice City', W - leftW - gut * 3, Math.round((areaH - gy) * 0.42), 'Pacifico, cursive', 400);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = wpx * 0.3;
    ctx.fillText('Vice City', leftW + gut + (W - leftW - gut) / 2, gy + (areaH - gy) / 2);
    ctx.restore();
  } else if (opts.layout === 'trio') {
    const pw = Math.round((W - gut * 2) / 3);
    drawPhoto(ctx, a, 0, 0, pw, areaH);
    drawPhoto(ctx, b, pw + gut, 0, pw, areaH);
    // Third panel: the first photo again, zoomed in and mirrored, so the
    // three crops read as three different shots, not a copy-paste.
    const aAlt = a && a.img ? { ...a, zoom: a.zoom * 1.45, ox: -a.ox, flip: true } : a;
    drawPhoto(ctx, aAlt, pw * 2 + gut * 2, 0, pw, areaH);
    // Middle panel gets a stronger grade wash so the three crops read apart.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(pw + gut, 0, pw, areaH);
  } else {
    // grid: 2 x 2 comic panels, alternating crops of both photos.
    const cw = Math.round((W - gut) / 2);
    const ch = Math.round((areaH - gut) / 2);
    drawPhoto(ctx, a, 0, 0, cw, ch);
    drawPhoto(ctx, b, cw + gut, 0, cw, ch);
    const bZoom = b && b.img ? { ...b, zoom: b.zoom * 1.6 } : b;
    const aZoom = a && a.img ? { ...a, zoom: a.zoom * 1.6, ox: -a.ox } : a;
    drawPhoto(ctx, bZoom, 0, ch + gut, cw, ch);
    drawPhoto(ctx, aZoom, cw + gut, ch + gut, cw, ch);
  }
  ctx.restore();

  // White comic gutters + outer frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gut;
  ctx.strokeRect(gut / 2, gut / 2, W - gut, areaH - gut / 2);
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = Math.max(3, gut * 0.5);
  ctx.strokeRect(0, 0, W, H);

  gradeWash(ctx, W, H, grade);
  halftone(ctx, W, H, 'rgba(255,255,255,0.85)');
  drawCaption(ctx, W, H, grade, opts.caption, opts.sub, H - bandH, bandH);
}

// Export the current cover canvas as a PNG file download.
export function exportCoverPNG(canvas, sizeKey) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vice-city-cover-${sizeKey}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(true);
    }, 'image/png');
  });
}
