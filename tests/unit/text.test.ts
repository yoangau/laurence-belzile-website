import { describe, expect, it } from 'vitest';
import { blockHtml, excerpt, inlineHtml, plainText } from '../../src/content/text';

describe('inlineHtml', () => {
  it('renders italic, bold and links', () => {
    expect(inlineHtml('*Titre*, **gras** et [lien](https://a.b)')).toBe(
      '<em>Titre</em>, <strong>gras</strong> et <a href="https://a.b" target="_blank" rel="noopener">lien</a>',
    );
  });

  it('escapes HTML typed in the admin', () => {
    expect(inlineHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('refuses javascript: links', () => {
    expect(inlineHtml('[x](javascript:alert)')).toBe('[x](javascript:alert)');
  });

  it('localizes internal links without target=_blank', () => {
    expect(inlineHtml('[expo](/projet/LB00528)', (u) => `/en${u}`)).toBe('<a href="/en/projet/LB00528">expo</a>');
  });
});

describe('blockHtml', () => {
  it('splits paragraphs and headings', () => {
    expect(blockHtml('## Biographie\n\nNée en 1994.\nLigne 2\n\nAutre')).toBe(
      '<h2>Biographie</h2>\n<p>Née en 1994.<br>Ligne 2</p>\n<p>Autre</p>',
    );
  });
});

describe('plainText / excerpt', () => {
  it('strips markup', () => {
    expect(plainText('## T\n\n*a* **b** [c](https://d)')).toBe('T a b c');
  });

  it('cuts on a word boundary', () => {
    expect(excerpt('un deux trois quatre', 12)).toBe('un deux…');
  });
});
