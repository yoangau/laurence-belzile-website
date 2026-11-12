/**
 * Artwork page: zoomable lightbox (PhotoSwipe), keyboard arrows and swipe to the previous/next work.
 */
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const page = document.querySelector<HTMLElement>('[data-artwork]');

if (page) {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '[data-gallery]',
    children: 'a[data-pswp-width]',
    pswpModule: () => import('photoswipe'),
    bgOpacity: 0.95,
    wheelToZoom: true,
    secondaryZoomLevel: 2,
    maxZoomLevel: 4,
  });
  lightbox.init();

  const isLightboxOpen = () => !!lightbox.pswp;
  const go = (rel: 'prev' | 'next') => {
    const link = document.querySelector<HTMLAnchorElement>(`a[rel="${rel}"]`);
    if (link) location.href = link.href;
  };

  document.addEventListener('keydown', (event) => {
    if (isLightboxOpen() || event.altKey || event.ctrlKey || event.metaKey) return;
    if ((event.target as HTMLElement).closest('input, textarea')) return;
    if (event.key === 'ArrowLeft') go('prev');
    if (event.key === 'ArrowRight') go('next');
  });

  // Horizontal swipe (touch only) on the page, outside the lightbox.
  let start: { x: number; y: number } | null = null;
  page.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0];
      start = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
    },
    { passive: true },
  );
  page.addEventListener(
    'touchmove',
    (event) => {
      const touch = event.touches[0];
      if (!start || !touch || isLightboxOpen()) return;
      const dx = touch.clientX - start.x;
      if (Math.abs(dx) > Math.abs(touch.clientY - start.y)) {
        page.style.transform = `translateX(${dx}px)`;
        page.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 300));
      }
    },
    { passive: true },
  );
  page.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    start = null;
    if (!isLightboxOpen() && Math.abs(dx) > 120 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx > 0 ? 'prev' : 'next');
      return;
    }
    page.style.transform = '';
    page.style.opacity = '';
  });
}
