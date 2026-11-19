// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo; ?shot=cover shows the cover alone. window.__shotReady is set once
// the scene is painted. Query params: photo, photo2, layout, grade,
// caption, sub, accent, size (e.g. 1920x1080).
export async function runShot(shot, query, api) {
  const scene = {
    photo: query.get('photo') ?? 'pier',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    caption: query.get('caption') ?? 'Sunset Heist',
    sub: query.get('sub') ?? 'Vice City Nights',
    accentWord: query.get('accent') ?? 'Welcome to',
    size: query.get('size') ?? null,
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await api.apply(scene);
  // wait for the webfonts so the lettering is real in the shot
  try { await document.fonts.ready; } catch { /* fonts are local; keep going */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
