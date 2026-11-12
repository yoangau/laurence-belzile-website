/**
 * Feed pages (home, work, exhibitions):
 *  - highlights the current year in the year rail while scrolling;
 *  - "Toutes / Disponibles" filter on /work (state kept in the URL hash-free query `?filtre=disponibles`).
 */
const feed = document.querySelector<HTMLElement>('[data-feed]');

if (feed) {
  const rails = [...document.querySelectorAll<HTMLElement>('[data-year-rail]')];
  const filterButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];

  const activeRail = () => rails.find((r) => !r.hidden);

  const highlight = () => {
    const rail = activeRail();
    if (!rail) return;
    const links = [...rail.querySelectorAll<HTMLAnchorElement>('a')];
    let current = links[0];
    for (const link of links) {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.3) current = link;
    }
    for (const link of links) link.toggleAttribute('aria-current', link === current);
  };

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        highlight();
        ticking = false;
      });
    },
    { passive: true },
  );
  highlight();

  const applyFilter = (value: string) => {
    feed.dataset.filter = value;
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.filter === value));
    for (const rail of rails) rail.hidden = rail.dataset.yearRail !== value;
    const url = new URL(location.href);
    if (value === 'available') url.searchParams.set('filtre', 'disponibles');
    else url.searchParams.delete('filtre');
    history.replaceState(null, '', url);
    highlight();
  };

  for (const button of filterButtons) button.addEventListener('click', () => applyFilter(button.dataset.filter!));
  if (filterButtons.length && new URLSearchParams(location.search).get('filtre') === 'disponibles')
    applyFilter('available');
}
