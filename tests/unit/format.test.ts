import { describe, expect, it } from 'vitest';
import {
  formatDimensions,
  formatPrice,
  ogImageSize,
  pick,
  saleHref,
  srcset,
  suggestPrice,
  titleHtml,
  variantWidths,
} from '../../src/content/format';
import { IMAGE_WIDTHS, type Artwork, type Image } from '../../src/content/schema';

const image: Image = {
  id: 'LB1-abc',
  width: 960,
  height: 1440,
  widths: [480, 960],
  lqip: 'data:image/webp;base64,',
  color: '#000000',
};
const artwork: Artwork = {
  kind: 'artwork',
  id: 'LB00654',
  title: { fr: 'Retourner', en: '' },
  year: 2025,
  images: [image],
  displayWidth: 45,
  hidden: false,
  availability: 'available',
  price: 210,
  dimensions: [5, 7],
};

describe('format helpers', () => {
  it('falls back to French when English is empty', () => {
    expect(pick({ fr: 'œuvre', en: '' }, 'en')).toBe('œuvre');
    expect(pick({ fr: 'œuvre', en: 'work' }, 'en')).toBe('work');
  });

  it('formats dimensions and prices like v1', () => {
    expect(formatDimensions([4, 4.5])).toBe('4" x 4.5"');
    expect(formatPrice(210, 'fr')).toBe('210 $');
    expect(formatPrice(210, 'en')).toBe('$210');
  });

  it('renders titles in italics, untitled plain', () => {
    expect(titleHtml(artwork, 'fr')).toBe('<em>Retourner</em>');
    expect(titleHtml({ ...artwork, title: { fr: '', en: '' } }, 'en')).toBe('untitled');
  });

  it('builds the purchase e-mail like v1', () => {
    expect(saleHref(artwork, 'a@b.c', 'fr')).toBe('mailto:a@b.c?subject=%5BLB00654%5D%20Retourner');
    expect(saleHref({ ...artwork, saleUrl: 'https://shop' }, 'a@b.c', 'fr')).toBe('https://shop');
  });

  it('suggests prices regardless of dimension order', () => {
    const table = [{ dimensions: [7, 5] as [number, number], price: 210 }];
    expect(suggestPrice([5, 7], table)).toBe(210);
    expect(suggestPrice([5, 8], table)).toBeUndefined();
  });

  it('chooses variant widths', () => {
    expect(variantWidths(1000, IMAGE_WIDTHS)).toEqual([480, 960]);
    expect(variantWidths(1500, IMAGE_WIDTHS)).toEqual([480, 960, 1500]);
    expect(variantWidths(4608, IMAGE_WIDTHS)).toEqual([480, 960, 1600, 2400]);
    expect(variantWidths(300, IMAGE_WIDTHS)).toEqual([300]);
  });

  it('computes srcset and og size', () => {
    expect(srcset('/media', image)).toBe('/media/img/LB1-abc/480.webp 480w, /media/img/LB1-abc/960.webp 960w');
    expect(ogImageSize(image)).toEqual({ width: 800, height: 1200 });
  });
});
