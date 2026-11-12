import { describe, expect, it } from 'vitest';
import { alternatePath, localePath } from '../../src/i18n/ui';
import { mediaTarget } from '../../src/server/media';

describe('locale paths', () => {
  it('keeps French at the root and prefixes English', () => {
    expect(localePath('fr', '/work')).toBe('/work');
    expect(localePath('en', '/work')).toBe('/en/work');
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('en', 'https://x.y')).toBe('https://x.y');
  });

  it('switches language on the same page', () => {
    expect(alternatePath('/projet/LB00001', 'en')).toBe('/en/projet/LB00001');
    expect(alternatePath('/en/projet/LB00001', 'fr')).toBe('/projet/LB00001');
    expect(alternatePath('/en', 'fr')).toBe('/');
  });
});

describe('media keys the admin may write', () => {
  it('accepts image variants, documents and originals', () => {
    expect(mediaTarget('img/LB00654-a1b2c3/960.webp')?.bucket).toBe('MEDIA');
    expect(mediaTarget('img/LB00654-a1b2c3/og.jpg')?.cacheControl).toContain('immutable');
    expect(mediaTarget('docs/catalogue2027.pdf')?.contentType).toBe('application/pdf');
    expect(mediaTarget('originals/LB00654-a1b2c3.jpg')?.bucket).toBe('CONTENT');
  });

  it('refuses anything else', () => {
    expect(mediaTarget('draft.json')).toBeNull();
    expect(mediaTarget('img/../draft.json')).toBeNull();
    expect(mediaTarget('img/x/evil.html')).toBeNull();
    expect(mediaTarget('published.json')).toBeNull();
  });
});
