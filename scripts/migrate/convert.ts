/**
 * Pure conversion from the v1 data to the v2 content document.
 * Image processing is injected (`imageFor`) so this stays fast and testable.
 */
import type { Artwork, Content, CvSection, Document, Exhibition, Image, L10n, Work } from '../../src/content/schema';
import { LEGACY_PATHS, type Legacy, type LegacyProject } from './legacy';

export type Report = { warnings: string[] };

/** v1 stored HTML in translations; v2 uses the markdown subset from `src/content/text.ts`. */
export const htmlToMarkdown = (html: string): string =>
  html
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<\/?[a-z][^>]*>/gi, '') // unmatched tags (en.json has two unclosed <i>)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();

const PHOTOGRAPHER_IDS: Record<string, string> = {
  'photo-credit-0': 'laurence-belzile',
  'photo-credit-1': 'champagne-paradis',
  'photo-credit-2': 'debora-flor',
  'photo-credit-4': 'macb',
};

/** "4,5" → 4.5 ; returns undefined when the string isn't `a" x b"`. */
export const parseDimensions = (s: unknown): [number, number] | undefined => {
  if (typeof s !== 'string') return undefined; // v1 also has `null` and `[]`
  const m = s.trim().match(/^([\d.,]+)\s*"\s*x\s*([\d.,]+)\s*"$/i);
  if (!m) return undefined;
  const a = Number(m[1]!.replace(',', '.'));
  const b = Number(m[2]!.replace(',', '.'));
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : undefined;
};

/** Same wording as v1's `formatTechnique`: "a, b et c sur papier". */
export const formatMedium = (techniques: string[], t: (key: string) => string, and: string): string => {
  const words = techniques.map(t);
  if (words.length <= 2) return words.join(' ');
  return `${words.slice(0, -2).join(', ')} ${and} ${words.at(-2)} ${words.at(-1)}`;
};

/** `imageFor` receives a path relative to the legacy checkout root. */
export const convert = (
  legacy: Legacy,
  imageFor: (path: string, credit?: string) => Image,
  report: Report,
): Content => {
  const projectImage = (src: string, photographer?: string) =>
    imageFor(`${LEGACY_PATHS.projects}/${src}`, photographer);
  const fr = legacy.fr;
  const en = legacy.en;
  const tr = (ns: keyof Legacy['fr'], key: string): L10n => {
    const f = fr[ns][key];
    const e = en[ns][key];
    if (f === undefined) report.warnings.push(`Missing French translation ${ns}.${key}`);
    if (e === undefined) report.warnings.push(`Missing English translation ${ns}.${key}`);
    const frText = htmlToMarkdown(f ?? '');
    const enText = htmlToMarkdown(e ?? '');
    return { fr: frText, en: enText === frText ? '' : enText };
  };

  const credit = (key: string | undefined) => {
    if (!key) return undefined;
    const id = PHOTOGRAPHER_IDS[key];
    if (!id) report.warnings.push(`Unknown photo credit ${key}`);
    return id;
  };

  const titleOf = (p: LegacyProject): L10n => {
    if (!p.title || p.title === '@@untitled') return { fr: '', en: '' };
    if (p.title.startsWith('@@')) {
      const t = tr('work', p.title);
      return { fr: t.fr.replace(/\*/g, ''), en: t.en.replace(/\*/g, '') };
    }
    return { fr: p.title.trim(), en: '' };
  };

  const convertProject = (p: LegacyProject): Work => {
    for (const key of Object.keys(p)) {
      if (key === 'expo-only' || key.endsWith('-description')) {
        report.warnings.push(`${p.id}: dropped unused field "${key}"`);
      }
    }
    const images = [
      projectImage(p.src, credit(p['photo-credit'])),
      ...(p['additional-images'] ?? []).map((a) => projectImage(a.src, credit(a['photo-credit']))),
    ];
    const base = {
      id: p.id,
      title: titleOf(p),
      year: p.year,
      ...(p.description ? { description: tr('work', p.description) } : {}),
      images,
      displayWidth: Math.min(100, Math.max(10, parseInt(p.width, 10) || 60)),
      hidden: false,
    };

    if (p.expo) {
      const exhibition: Exhibition = {
        ...base,
        kind: 'exhibition',
        ...(typeof p.dimension === 'string' && p.dimension.trim() ? { venue: p.dimension.trim() } : {}),
      };
      return exhibition;
    }

    const dimensions = parseDimensions(p.dimension);
    // v1 sometimes put other text (e.g. a gallery name) in `dimension`; keep it as the description.
    const dimensionText = typeof p.dimension === 'string' ? p.dimension.trim() : '';
    if (dimensionText && !dimensions) {
      report.warnings.push(`${p.id}: "${dimensionText}" is not a dimension, moved to the description`);
      if (!base.description) Object.assign(base, { description: { fr: dimensionText, en: '' } });
    }

    const hasShop = !!p['buy-ref'] && p['buy-ref'] !== 'null';
    const availability: Artwork['availability'] =
      p.available === null ? 'none' : p.available === false ? 'sold' : p.price && hasShop ? 'available' : 'unavailable';

    const medium = p.technique?.length
      ? {
          fr: formatMedium(p.technique, (k) => fr.work[k] ?? k, fr.work.and ?? 'et'),
          en: formatMedium(p.technique, (k) => en.work[k] ?? k, en.work.and ?? 'and'),
        }
      : undefined;

    const artwork: Artwork = {
      ...base,
      kind: 'artwork',
      ...(medium ? { medium } : {}),
      ...(dimensions ? { dimensions } : {}),
      availability,
      ...(p.price ? { price: p.price } : {}),
      ...(hasShop && p['buy-ref']!.startsWith('http') ? { saleUrl: p['buy-ref']! } : {}),
    };
    return artwork;
  };

  // v1 lists oldest first and reverses for display; v2 stores display order.
  const works = [...legacy.projects].reverse().map(convertProject);

  const cv: CvSection[] = legacy.resume.map((section) => ({
    id: section.title.replace(/-title$/, ''),
    title: tr('resume', section.title),
    entries: section.year.flatMap(({ date, list }) =>
      list.map(({ val, link }) => ({
        year: String(date),
        text: tr('resume', val),
        ...(link ? { url: link } : {}),
      })),
    ),
  }));

  const info = (key: string) => tr('info', key);
  const bioParts: [string, 'heading' | 'text'][] = [
    ['content-0', 'heading'],
    ['content', 'text'],
    ['content-2', 'heading'],
    ...[3, 4, 5, 6, 7, 8, 9].map((i): [string, 'text'] => [`content-${i}`, 'text']),
  ];
  const joinBio = (locale: 'fr' | 'en') =>
    bioParts
      .filter(([key]) => fr.info[key] !== undefined)
      .map(([key, kind]) => {
        const t = info(key);
        const text = locale === 'en' ? t.en || t.fr : t.fr;
        return kind === 'heading' ? `## ${text}` : text;
      })
      .join('\n\n');

  const documents: Document[] = [
    {
      id: 'catalogue',
      label: { fr: 'catalogue', en: '' },
      file: { fr: 'docs/catalogue2026.pdf', en: 'docs/catalogue2026.pdf' },
      placement: 'nav',
      legacyPaths: ['/catalogue2026.pdf'],
    },
    {
      id: 'cv',
      label: tr('resume', 'download'),
      file: { fr: `docs/${fr.resume.file}`, en: `docs/${en.resume.file}` },
      placement: 'cv',
      legacyPaths: [`/resume/${fr.resume.file}`, `/resume/${en.resume.file}`],
    },
    {
      id: 'press',
      label: tr('resume', 'download-press'),
      file: { fr: `docs/${fr.resume['file-press']}`, en: `docs/${en.resume['file-press']}` },
      placement: 'cv',
      legacyPaths: [`/resume/${fr.resume['file-press']}`, `/resume/${en.resume['file-press']}`],
    },
  ];

  const priceTable = Object.entries(legacy.priceMap).flatMap(([key, price]) => {
    const dimensions = parseDimensions(key);
    if (!dimensions) {
      report.warnings.push(`Price table: could not parse "${key}"`);
      return [];
    }
    return [{ dimensions, price }];
  });

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    works,
    cv,
    bio: { fr: joinBio('fr'), en: joinBio('en') },
    documents,
    settings: {
      email: 'laurence.belzile.arts@gmail.com',
      instagramUrl: 'https://www.instagram.com/laurencebelzile/',
      facebookUrl: 'https://www.facebook.com/laurence.belzile.art/',
      photographers: Object.entries(PHOTOGRAPHER_IDS).map(([key, id]) => ({ id, name: fr.work[key] ?? id })),
      priceTable,
      portrait: imageFor(LEGACY_PATHS.portrait),
      analyticsId: 'G-1JWD7MJCTV',
    },
  };
};
