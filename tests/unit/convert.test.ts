import { describe, expect, it } from 'vitest';
import { convert, formatMedium, htmlToMarkdown, parseDimensions } from '../../scripts/migrate/convert';
import type { Legacy, LegacyProject } from '../../scripts/migrate/legacy';
import { ContentSchema, type Image } from '../../src/content/schema';

const project = (over: Partial<LegacyProject>): LegacyProject => ({
  id: 'LB00001',
  src: 'LB00001.jpg',
  available: true,
  title: 'A 9',
  dimension: '4" x 4,5"',
  technique: ['acrylic', 'canvas-masonite'],
  year: 2017,
  price: 135,
  'buy-ref': 'mailto:laurence.belzile.arts@gmail.com',
  expo: false,
  'photo-credit': 'photo-credit-0',
  width: '30%',
  ...over,
});

const ns = (work: Record<string, string>, resume: Record<string, string> = {}) => ({
  common: {},
  contact: {},
  info: { 'content-0': 'Bio', content: 'Texte' },
  resume: { download: 'CV', 'download-press': 'Presse', file: 'cv.pdf', 'file-press': 'p.pdf', ...resume },
  work,
});

const legacy = (projects: LegacyProject[]): Legacy => ({
  root: '/legacy',
  projects,
  resume: [
    { title: 'studies-title', year: [{ date: 2019, list: [{ val: 'studies-2019', link: '/projet/LB00002' }] }] },
  ],
  fr: ns(
    {
      acrylic: 'acrylique',
      'canvas-masonite': 'sur toile montée sur masonite',
      'photo-credit-0': 'Laurence Belzile',
      and: 'et',
      'd-1': 'Une <i>expo</i><br/><br/>suite',
    },
    { 'studies-title': 'Éducation', 'studies-2019': 'Maîtrise, <i>thèse</i>' },
  ),
  en: ns(
    { acrylic: 'acrylic', 'canvas-masonite': 'on canvas mounted on masonite', and: 'and', 'd-1': 'An <i>exhibit</i>' },
    { 'studies-title': 'Education', 'studies-2019': 'Master' },
  ),
  priceMap: { '4" x 4.5"': 135, '43" x 57" ': 3628 },
});

const fakeImage = (path: string): Image => ({
  id: path
    .split('/')
    .pop()!
    .replace(/\.\w+$/, ''),
  width: 960,
  height: 1440,
  widths: [480, 960],
  lqip: 'data:image/webp;base64,',
  color: '#000000',
});

describe('migration helpers', () => {
  it('converts v1 HTML to markdown', () => {
    expect(htmlToMarkdown('<i>Titre</i> et <b>gras</b><br/><br/>para<br/>ligne')).toBe(
      '*Titre* et **gras**\n\npara\nligne',
    );
    expect(htmlToMarkdown('<i>non fermé')).toBe('non fermé');
  });

  it('parses dimensions with comma decimals and stray spaces', () => {
    expect(parseDimensions('4" x 4,5"')).toEqual([4, 4.5]);
    expect(parseDimensions('43" x 57" ')).toEqual([43, 57]);
    expect(parseDimensions('Galerie X')).toBeUndefined();
    expect(parseDimensions([])).toBeUndefined();
  });

  it('formats techniques exactly like v1', () => {
    const t = (k: string) => ({ a: 'gouache', b: 'encre', c: 'pastel', s: 'sur papier' })[k] ?? k;
    expect(formatMedium(['a', 's'], t, 'et')).toBe('gouache sur papier');
    expect(formatMedium(['a', 'b', 's'], t, 'et')).toBe('gouache et encre sur papier');
    expect(formatMedium(['a', 'b', 'c', 's'], t, 'et')).toBe('gouache, encre et pastel sur papier');
  });
});

describe('convert', () => {
  const run = (projects: LegacyProject[]) => {
    const report = { warnings: [] as string[] };
    return {
      content: convert(legacy(projects), (p, credit) => ({ ...fakeImage(p), ...(credit ? { credit } : {}) }), report),
      report,
    };
  };

  it('produces valid content in display order (newest first)', () => {
    const { content } = run([project({}), project({ id: 'LB00002', src: 'LB00002.jpg', year: 2018 })]);
    expect(ContentSchema.safeParse(content).success).toBe(true);
    expect(content.works.map((w) => w.id)).toEqual(['LB00002', 'LB00001']);
  });

  it('maps availability, medium and dimensions', () => {
    const { content } = run([
      project({}),
      project({ id: 'LB2', available: false, price: null }),
      project({ id: 'LB3', available: null }),
      project({ id: 'LB4', 'buy-ref': null }),
      project({ id: 'LB5', 'buy-ref': 'https://champagneparadis.com/x' }),
    ]);
    const byId = Object.fromEntries(content.works.map((w) => [w.id, w]));
    expect(byId.LB00001).toMatchObject({
      availability: 'available',
      price: 135,
      dimensions: [4, 4.5],
      medium: { fr: 'acrylique sur toile montée sur masonite', en: 'acrylic on canvas mounted on masonite' },
      displayWidth: 30,
      title: { fr: 'A 9', en: '' },
    });
    expect(byId.LB2).toMatchObject({ availability: 'sold' });
    expect(byId.LB3).toMatchObject({ availability: 'none' });
    expect(byId.LB4).toMatchObject({ availability: 'unavailable' });
    expect(byId.LB5).toMatchObject({ availability: 'available', saleUrl: 'https://champagneparadis.com/x' });
  });

  it('turns expo entries into exhibitions with their venue', () => {
    const { content } = run([
      project({ expo: true, dimension: 'Galerie Montcalm (QC)', title: 'S’arracher', description: 'd-1' }),
    ]);
    expect(content.works[0]).toMatchObject({
      kind: 'exhibition',
      venue: 'Galerie Montcalm (QC)',
      description: { fr: 'Une *expo*\n\nsuite', en: 'An *exhibit*' },
    });
  });

  it('keeps non-dimension text as the description and reports it', () => {
    const { content, report } = run([project({ dimension: 'Galerie X (QC)', available: null })]);
    expect(content.works[0]).toMatchObject({ description: { fr: 'Galerie X (QC)', en: '' } });
    expect(content.works[0]).not.toHaveProperty('dimensions');
    expect(report.warnings.join()).toMatch(/not a dimension/);
  });

  it('converts the CV and the price table', () => {
    const { content } = run([project({})]);
    expect(content.cv[0]).toEqual({
      id: 'studies',
      title: { fr: 'Éducation', en: 'Education' },
      entries: [{ year: '2019', text: { fr: 'Maîtrise, *thèse*', en: 'Master' }, url: '/projet/LB00002' }],
    });
    expect(content.settings.priceTable).toEqual([
      { dimensions: [4, 4.5], price: 135 },
      { dimensions: [43, 57], price: 3628 },
    ]);
  });
});
