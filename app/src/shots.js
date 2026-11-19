// Fixed scenes for screenshots: ?shot=cover loads a sample photo and hides the editor,
// ?shot=editor loads a sample photo and keeps the editor visible. Both use the kit's
// free sample photos, so the screenshots show the real app at work.
const SAMPLES = { boulevard: './samples/boulevard.jpg', pier: './samples/pier.jpg' };

/** Sets up a screenshot scene, then calls `apply(sampleUrl, caption)` to load the photo. */
export async function runShot(shot, params, apply) {
  const sample = SAMPLES[params.get('photo')] || SAMPLES.pier;
  const caption = params.get('caption') || 'Vice City Nights';
  const layout = params.get('layout');
  const grade = params.get('grade');
  if (layout) document.querySelector(`[data-layout="${layout}"]`)?.click();
  if (grade) document.querySelector(`[data-grade="${grade}"]`)?.click();
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await apply(sample, caption);
}
