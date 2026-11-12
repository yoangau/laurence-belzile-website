/**
 * The tiny markdown subset used in every text field:
 *   *italic*   **bold**   [label](https://url)
 * Long texts (bio, descriptions) also support blank-line paragraphs and `## Heading` lines.
 * Everything else is escaped, so raw HTML typed in the admin is shown as text.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isSafeUrl = (url: string) => /^(https?:|mailto:|\/)/i.test(url);

/** Renders inline markdown to HTML. `linkHref` lets callers localize internal paths. */
export const inlineHtml = (text: string, linkHref: (url: string) => string = (u) => u): string =>
  escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) =>
      isSafeUrl(url)
        ? `<a href="${linkHref(url)}"${url.startsWith('/') ? '' : ' target="_blank" rel="noopener"'}>${label}</a>`
        : match,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

/** Renders a long text: paragraphs separated by blank lines, `## ` headings. */
export const blockHtml = (text: string, linkHref?: (url: string) => string): string =>
  text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((block) => {
      const heading = block.match(/^##\s+([\s\S]*)$/);
      return heading
        ? `<h2>${inlineHtml(heading[1]!.trim(), linkHref)}</h2>`
        : `<p>${inlineHtml(block.trim(), linkHref)}</p>`;
    })
    .join('\n');

/** Strips markup, for `alt`, `<title>` and meta descriptions. */
export const plainText = (text: string): string =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^##\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

/** First ~160 characters of a text, for meta descriptions. */
export const excerpt = (text: string, max = 160): string => {
  const plain = plainText(text);
  return plain.length <= max ? plain : `${plain.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};
