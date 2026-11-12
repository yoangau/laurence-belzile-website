/** Presentation helpers shared by the public site and the admin. */
import type { Artwork, Content, Image, L10n, Locale, PriceRow, Work } from './schema';
import { inlineHtml, plainText } from './text';

export const pick = (text: L10n | undefined, locale: Locale): string =>
  !text ? '' : locale === 'en' ? text.en.trim() || text.fr : text.fr;

export const UNTITLED: L10n = { fr: 'sans titre', en: 'untitled' };

/** The title as markdown, with the "untitled" fallback. */
export const titleText = (work: Work, locale: Locale): string => pick(work.title, locale) || pick(UNTITLED, locale);

export const titlePlain = (work: Work, locale: Locale): string => plainText(titleText(work, locale));

const formatNumber = (n: number) => String(Number(n.toFixed(2)));

export const formatDimensions = (dimensions: Artwork['dimensions']): string =>
  dimensions ? `${formatNumber(dimensions[0])}" x ${formatNumber(dimensions[1])}"` : '';

export const formatPrice = (price: number, locale: Locale): string => (locale === 'en' ? `$${price}` : `${price} $`);

/** Purchase link: the gallery shop, or an e-mail with the id and title in the subject (like the old site). */
export const saleHref = (work: Artwork, email: string, locale: Locale): string =>
  work.saleUrl ?? `mailto:${email}?subject=${encodeURIComponent(`[${work.id}] ${titlePlain(work, locale)}`)}`;

/** Price suggested by the price table (dimensions match in either order). */
export const suggestPrice = (dimensions: Artwork['dimensions'], table: PriceRow[]): number | undefined => {
  if (!dimensions) return undefined;
  const [a, b] = dimensions;
  return table.find(({ dimensions: [x, y] }) => (x === a && y === b) || (x === b && y === a))?.price;
};

export const publishedWorks = (content: Content): Work[] => content.works.filter((w) => !w.hidden);

/** Media URLs. `base` is PUBLIC_MEDIA_URL (https://media.laurencebelzile.com, or /media when not set). */
export const imageUrl = (base: string, image: Image, width: number) => `${base}/img/${image.id}/${width}.webp`;
export const ogImageUrl = (base: string, image: Image) => `${base}/img/${image.id}/og.jpg`;
/** og.jpg fits inside 1200×1200. */
export const OG_MAX = 1200;
export const ogImageSize = (image: Image) => {
  const scale = Math.min(1, OG_MAX / image.width, OG_MAX / image.height);
  return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) };
};
export const largestWidth = (image: Image) => Math.max(...image.widths);
export const srcset = (base: string, image: Image) =>
  [...image.widths]
    .sort((a, b) => a - b)
    .map((w) => `${imageUrl(base, image, w)} ${w}w`)
    .join(', ');
export const docUrl = (base: string, key: string) => `${base}/${key}`;

/** Height of a variant, preserving the aspect ratio. */
export const heightFor = (image: Image, width: number) => Math.round((image.height * width) / image.width);

/** Which widths to generate for an original of `originalWidth` px. */
export const variantWidths = (originalWidth: number, candidates: readonly number[]): number[] => {
  const widths = candidates.filter((w) => w <= originalWidth);
  const largest = widths.at(-1) ?? 0;
  if (originalWidth < candidates.at(-1)! && largest < originalWidth * 0.9) widths.push(originalWidth);
  return widths;
};

/** The title as HTML: italic when the work has a title, plain "sans titre" otherwise. */
export const titleHtml = (work: Work, locale: Locale): string =>
  pick(work.title, locale) ? `<em>${inlineHtml(pick(work.title, locale))}</em>` : pick(UNTITLED, locale);
