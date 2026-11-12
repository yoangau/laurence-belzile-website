/** Fades `.reveal` elements in as they scroll into view. */
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -5% 0px' },
);

for (const el of document.querySelectorAll('.reveal')) observer.observe(el);
