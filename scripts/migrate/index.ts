/**
 * One-off migration from the v1 site (a checkout of `master`) to v2 content + media.
 *
 *   git worktree add --detach ../legacy-master master
 *   npm run migrate -- --legacy ../legacy-master                    # convert + generate images
 *   npm run migrate -- --legacy ../legacy-master --upload local     # …and fill local R2 for `npm run dev`
 *   npm run migrate -- --legacy ../legacy-master --upload remote    # …and fill the real buckets (cutover)
 *
 * Idempotent: images are cached in `.migration/`, so it can be re-run right before cutover
 * to pick up the last edits made on the old site.
 */
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ContentSchema, type Image } from '../../src/content/schema';
import { convert, type Report } from './convert';
import { LEGACY_PATHS, loadLegacy } from './legacy';
import { mapLimit, processImage, type ProcessedImage } from './images';
import { contentTypeFor, createPut, uploadMedia, type Target } from './upload';

const { values } = parseArgs({
  options: {
    legacy: { type: 'string' },
    out: { type: 'string', default: '.migration' },
    upload: { type: 'string' },
    'with-originals': { type: 'boolean', default: false },
  },
});

const log = (msg: string) => console.log(msg);
const exists = (p: string) => stat(p).then(() => true, () => false);

const main = async () => {
  if (!values.legacy) throw new Error('Usage: npm run migrate -- --legacy <path to a checkout of master>');
  const root = values.legacy;
  const outDir = values.out!;
  const mediaDir = join(outDir, 'media');
  const legacy = await loadLegacy(root);
  const report: Report = { warnings: [] };

  // Pass 1: find every image the content references.
  const paths = new Set<string>();
  convert(legacy, (path) => {
    paths.add(path);
    return { id: 'x', width: 1, height: 1, widths: [1], lqip: 'data:image/', color: '#000000' };
  }, { warnings: [] });

  log(`Processing ${paths.size} images (cached ones are skipped)…`);
  const processed = new Map<string, ProcessedImage>();
  let done = 0;
  await mapLimit([...paths], 4, async (path) => {
    processed.set(path, await processImage(join(root, path), mediaDir));
    if (++done % 50 === 0 || done === paths.size) log(`  ${done}/${paths.size}`);
  });

  // Pass 2: the real conversion.
  const content = ContentSchema.parse(
    convert(legacy, (path, credit): Image => ({ ...processed.get(path)!, ...(credit ? { credit } : {}) }), report),
  );

  // Images on disk that nothing references.
  const onDisk = (await readdir(join(root, LEGACY_PATHS.projects))).filter((f) => /\.(jpe?g|png)$/i.test(f));
  const unused = onDisk.filter((f) => !paths.has(`${LEGACY_PATHS.projects}/${f}`));
  if (unused.length) report.warnings.push(`${unused.length} images in public/projects are not used by any work: ${unused.join(', ')}`);

  // Documents.
  await mkdir(join(mediaDir, 'docs'), { recursive: true });
  for (const file of await readdir(join(root, LEGACY_PATHS.resume))) {
    await copyFile(join(root, LEGACY_PATHS.resume, file), join(mediaDir, 'docs', file));
  }
  const catalogue = join(mediaDir, 'docs', 'catalogue2026.pdf');
  if (!(await exists(catalogue))) {
    log('Downloading the catalogue from S3…');
    const res = await fetch(LEGACY_PATHS.catalogueUrl);
    if (res.ok) await writeFile(catalogue, new Uint8Array(await res.arrayBuffer()));
    else report.warnings.push(`Could not download the catalogue (${res.status}); upload it from the admin.`);
  }

  const json = JSON.stringify(content, null, 2);
  await writeFile(join(outDir, 'content.json'), json);
  await mkdir('.content', { recursive: true });
  await writeFile('.content/published.json', json);

  const artworks = content.works.filter((w) => w.kind === 'artwork');
  const summary = [
    `# Migration report (${content.updatedAt})`,
    '',
    `- Works: ${content.works.length} (${artworks.length} artworks, ${content.works.length - artworks.length} exhibitions)`,
    `- Available: ${artworks.filter((a) => a.availability === 'available').length}, sold: ${artworks.filter((a) => a.availability === 'sold').length}`,
    `- Images: ${paths.size}`,
    `- CV sections: ${content.cv.length} (${content.cv.reduce((n, s) => n + s.entries.length, 0)} entries)`,
    `- Price table rows: ${content.settings.priceTable.length}`,
    '',
    '## Warnings',
    '',
    ...(report.warnings.length ? report.warnings.map((w) => `- ${w}`) : ['None.']),
  ].join('\n');
  await writeFile(join(outDir, 'report.md'), summary);
  log(`\n${summary}\n\nWrote ${outDir}/content.json and .content/published.json`);

  if (values.upload) {
    const target = values.upload as Target;
    if (target !== 'local' && target !== 'remote') throw new Error('--upload must be "local" or "remote"');
    log(`Uploading to ${target} R2…`);
    const { put, dispose } = await createPut(target);
    try {
      await uploadMedia(put, mediaDir, log);
      await put('CONTENT', 'draft.json', json, 'application/json');
      await put('CONTENT', 'published.json', json, 'application/json');
      if (values['with-originals']) {
        log('  originals…');
        await mapLimit([...paths], 8, async (path) => {
          await put('CONTENT', `originals/${path.split('/').pop()}`, await readFile(join(root, path)), contentTypeFor(path));
        });
      }
    } finally {
      await dispose();
    }
    log('Upload done.');
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
