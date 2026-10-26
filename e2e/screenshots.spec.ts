import { expect, test, type Page } from '@playwright/test';
import { DEMO_PIN } from '../playwright.config';

// Walks the whole app against the mock backend and saves the portfolio screenshots.
// The assertions double as an end-to-end smoke test: if a screen or the flow breaks,
// the run fails instead of photographing a broken app.
// JPEG at 90: the grain texture makes PNGs ~3x heavier with no visible gain at this size.
// `animations: 'disabled'` lets CSS transitions finish, so no button is caught half-way.
const shot = async (page: Page, name: string) => {
  // Park the cursor off-screen so it can't leave a :hover state on whatever it last touched.
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `docs/screenshots/${name}.jpg`, type: 'jpeg', quality: 90, animations: 'disabled' });
};

// The wizard screens are taller than a phone: give them room so the floating nav
// doesn't cover the Back/Next buttons in the photo.
const TALL = { width: 390, height: 1000 };
const PHONE = { width: 390, height: 844 };

test('recorre la app y guarda las capturas', async ({ page }) => {
  // Every Supabase variable is pinned to the mock in playwright.config.ts, and the sample
  // sessions below only exist there, so a green run proves nothing real was read.

  // Home
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /cómo va tu groove/i })).toBeVisible();
  await shot(page, '01-inicio');

  // History (public, read-only)
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Tus rounds' })).toBeVisible();
  const newest = page.getByRole('link', { name: /14:11/ });
  await expect(newest).toBeVisible();
  await shot(page, '02-historial');

  // Session detail, with a rep ladder
  await newest.click();
  await expect(page.getByText('21-15-9 (45 reps)').first()).toBeVisible();
  await shot(page, '03-detalle');

  // Writing is owner-only: PIN gate first
  await page.goto('/log');
  await expect(page.getByRole('heading', { name: 'Acceso del propietario' })).toBeVisible();
  await shot(page, '04-acceso');

  await page.getByLabel('PIN').fill(DEMO_PIN);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Muéstrame el WOD' })).toBeVisible();
  await shot(page, '05-foto');

  // Wizard, filling a ladder by hand
  await page.getByRole('button', { name: 'Omitir y llenarlo a mano' }).click();
  await page.setViewportSize(TALL);
  await page.getByRole('button', { name: /Siguiente/ }).click();
  await expect(page.getByRole('heading', { name: 'Fuerza / Habilidad' })).toBeVisible();
  await page.getByLabel('Nombre del ejercicio').fill('Thruster');
  await page.getByRole('button', { name: 'Escalera' }).click();
  await page.getByLabel('Repeticiones por ronda').fill('21-15-9');
  await page.getByLabel('Peso', { exact: true }).fill('43');
  await page.getByLabel('Unidad del peso').selectOption('kg');
  await expect(page.getByText('3 rondas, 45 reps')).toBeVisible();
  await shot(page, '06-escalera');

  await page.getByRole('button', { name: /Siguiente/ }).click();
  await page.getByLabel('Formato del WOD').fill('For Time');
  await page.getByLabel('Tu resultado').fill('6:42');
  await page.getByLabel('Nombre del ejercicio').fill('Pull-ups');
  await page.getByRole('button', { name: 'Escalera' }).click();
  await page.getByLabel('Repeticiones por ronda').fill('21-15-9');
  await expect(page.getByText('3 rondas, 45 reps')).toBeVisible();
  // Scrolled to the end, where the padding keeps the action buttons clear of the nav.
  await page.setViewportSize(PHONE);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('button', { name: 'Guardar mi round' })).toBeInViewport();
  await shot(page, '07-wod');

  // Save, then the medal
  await page.getByRole('button', { name: 'Guardar mi round' }).click();
  await expect(page.getByRole('heading', { name: '¡Round guardado!' })).toBeVisible();
  await shot(page, '08-guardado');

  // 404
  await page.goto('/esto-no-existe');
  await expect(page.getByRole('heading', { name: /se perdió en el groove/i })).toBeVisible();
  await shot(page, '09-404');
});
