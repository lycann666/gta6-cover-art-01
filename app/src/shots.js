// Fixed scenes for screenshots. Query params: shot=cover|editor, photo and
// photo2 pick samples, layout / grade / caption / sub style the poster, and
// w / h size the canvas. window.__shotReady is set once painted.

const FALLBACKS = { layout: 'hero', grade: 'sunset', caption: 'Sunset Heist', sub: 'Vice City Nights' };

export async function runShot(shot, query, api) {
  const cfg = {
    layout: query.get('layout') ?? FALLBACKS.layout,
    grade: query.get('grade') ?? FALLBACKS.grade,
    caption: query.get('caption') ?? FALLBACKS.caption,
    sub: query.get('sub') ?? FALLBACKS.sub,
    w: Number(query.get('w') ?? 1080),
    h: Number(query.get('h') ?? 1080),
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const a = await api.loadSample(query.get('photo') ?? 'pier');
  const b = await api.loadSample(query.get('photo2') ?? 'boulevard');
  api.setPhotos(a, b);
  api.apply(cfg);
  await document.fonts.ready;
  api.draw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
