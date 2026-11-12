/**
 * Plays the fade-up animation on `.reveal` elements when they scroll into view.
 * Like v1 (react-reveal), an element is revealed once 20% of it is visible. Very tall elements
 * (a whole CV) can never be 20% visible, so they also reveal once they fill 20% of the screen.
 */
const FRACTION = 0.2;

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const visible =
        entry.intersectionRatio >= FRACTION || entry.intersectionRect.height >= window.innerHeight * FRACTION;
      if (!entry.isIntersecting || !visible) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  },
  { threshold: [0, 0.05, 0.1, FRACTION] },
);

for (const el of document.querySelectorAll('.reveal')) observer.observe(el);
