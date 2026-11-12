/**
 * Admin, end to end, against `npm run dev` (auth bypassed on localhost by DEV_AUTH_BYPASS=1 in .dev.vars).
 * Edits, uploads and publishes in the local storage, then puts the original draft back.
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { variantWidths } from '../../src/content/format';
import { IMAGE_WIDTHS, type Content } from '../../src/content/schema';

const PHOTO = process.env.ADMIN_TEST_PHOTO ?? '/home/user/legacy-master/public/projects/LB00654.jpg';
const SHOTS = process.env.ADMIN_SCREENSHOTS; // directory, optional

type State = { content: Content; etag: string; hasUnpublishedChanges: boolean };

const getState = async (request: APIRequestContext): Promise<State> =>
  (await (await request.get('/api/admin/content')).json()) as State;

const shot = async (page: Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
};

test.describe.configure({ mode: 'serial' });

let original: State;

test.beforeAll(async ({ request }) => {
  original = await getState(request);
});

test.afterAll(async ({ request }) => {
  // Put the original content back, as the draft and as the published version.
  const { etag } = await getState(request);
  const res = await request.put('/api/admin/content', {
    data: original.content,
    headers: { 'if-match': etag },
  });
  expect(res.ok()).toBe(true);
  if (!original.hasUnpublishedChanges) await request.post('/api/admin/publish');
});

const saveAndWait = async (page: Page) => {
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Modifications enregistrées.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
};

test('works list loads', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/oeuvres$/);
  await expect(page.getByRole('heading', { name: 'Œuvres' })).toBeVisible();
  const first = original.content.works.find((w) => w.kind === 'artwork')!;
  await expect(page.getByRole('link', { name: `Modifier ${first.title.fr}` })).toBeVisible();
  await shot(page, 'works');
});

test('edit a title, save, reload', async ({ page }) => {
  const work = original.content.works.find((w) => w.kind === 'artwork' && w.title.fr)!;
  await page.goto('/admin/oeuvres');
  await page.getByRole('link', { name: `Modifier ${work.title.fr}` }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/oeuvres/${work.id}$`));

  const title = page.getByLabel('Titre (français)');
  await title.fill(`${work.title.fr} (test)`);
  await expect(page.getByText('non enregistrées')).toBeVisible();
  await saveAndWait(page);

  await page.reload();
  await expect(page.getByLabel('Titre (français)')).toHaveValue(`${work.title.fr} (test)`);
  await shot(page, 'editor');
});

test('mark a work as sold from the list', async ({ page, request }) => {
  const work = original.content.works.find((w) => w.kind === 'artwork' && w.availability === 'available')!;
  await page.goto('/admin/oeuvres');
  await page.getByLabel('Rechercher').fill(work.id);
  await page.getByRole('button', { name: 'Marquer vendue' }).first().click();
  await expect(page.getByText(/est vendue/)).toBeVisible();

  const saved = (await getState(request)).content.works.find((w) => w.id === work.id)!;
  expect(saved.kind === 'artwork' && saved.availability).toBe('sold');
  expect(saved.kind === 'artwork' && saved.price).toBe(work.kind === 'artwork' ? work.price : undefined);
});

test('create an artwork with an uploaded image', async ({ page, request }) => {
  await page.goto('/admin/oeuvres');
  await page.getByRole('button', { name: 'Nouvelle œuvre' }).click();
  const id = await page.getByLabel('Numéro').inputValue();
  expect(id).toMatch(/^LB\d{5}$/);
  await page.getByRole('button', { name: 'Créer' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/oeuvres/${id}$`));

  // Saving without an image is refused, with a readable message.
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Ajoutez au moins une image').first()).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(PHOTO);
  await expect(page.getByAltText('Image 1')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Titre (français)').fill('Œuvre de test');
  await page.getByLabel('Largeur en pouces').fill('5');
  await page.getByLabel('Hauteur en pouces').fill('7');
  // Pre-filled from the price table.
  await expect(page.getByLabel('Prix (CAD)')).toHaveValue('210');
  await shot(page, 'new-artwork');
  await saveAndWait(page);

  const created = (await getState(request)).content.works[0]!;
  expect(created.id).toBe(id);
  expect(created.kind === 'artwork' && created.dimensions).toEqual([5, 7]);
  const image = created.images[0]!;
  expect(image.id).toMatch(new RegExp(`^${id}-[a-z0-9]{6}$`));
  // The photo is 1000×1500: same variants as the migration script would make.
  expect(image.widths).toEqual(variantWidths(1000, IMAGE_WIDTHS));
  expect([image.width, image.height]).toEqual([960, 1440]);
  expect(image.lqip).toMatch(/^data:image\/webp;base64,/);
  expect(image.color).toMatch(/^#[0-9a-f]{6}$/);
  expect(image.credit).toBe(original.content.settings.photographers[0]?.id);
  for (const file of [...image.widths.map((w) => `${w}.webp`), 'og.jpg']) {
    const res = await request.get(`/media/img/${image.id}/${file}`);
    expect(res.status(), file).toBe(200);
  }
  const webp = await request.get(`/media/img/${image.id}/480.webp`);
  expect(webp.headers()['content-type']).toBe('image/webp');
});

test('publish, then restore from the history', async ({ page, request }) => {
  await page.goto('/admin/oeuvres');
  await page.getByRole('button', { name: 'Publier' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();
  // No GitHub token locally: published, but the deploy is not started.
  await expect(page.getByText(/mise en ligne automatique n’a pas pu démarrer/)).toBeVisible();

  // Change something after publishing…
  const published = (await getState(request)).content;
  const work = published.works[0]!;
  await page.goto(`/admin/oeuvres/${work.id}`);
  await page.getByLabel('Titre (français)').fill('Titre à annuler');
  await saveAndWait(page);

  // …then restore the published version as the draft.
  await page.getByRole('link', { name: 'Historique' }).click();
  await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restaurer' }).first()).toBeVisible();
  await shot(page, 'history');
  await page.getByRole('button', { name: 'Restaurer' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restaurer' }).click();
  await expect(page.getByText('Version restaurée')).toBeVisible();

  expect((await getState(request)).content.works[0]!.title.fr).toBe(work.title.fr);
  await page.goto(`/admin/oeuvres/${work.id}`);
  await expect(page.getByLabel('Titre (français)')).toHaveValue(work.title.fr);
});
