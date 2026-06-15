/* ============================================================
   Portfolio motion system — shared across all pages
   - Page-entry fade via is-loaded on <body>
   - IntersectionObserver scroll reveals (animate once, unobserve)
   - Stagger delays for .reveal-group children
   - Respects prefers-reduced-motion
   - Progressive enhancement: no .js-motion = no hidden state
   ============================================================ */
(function () {
  'use strict';

  // ── 1. Page-entry fade ──────────────────────────────────────
  // Fires on DOMContentLoaded to trigger the body opacity 0→1 CSS transition.
  function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(function () {
    document.body.classList.add('is-loaded');
  });

  // ── 2. Bail out if reduced motion or no IntersectionObserver ──
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll(
      '.reveal, .section-header, .project-meta-grid, .project-images, ' +
      '.resume-section, .project-body, .study-pdf-embed, .about-body h2, .card'
    ).forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // ── 3. Stagger delays for .reveal-group children ──────────────
  // Applies incremental transition-delay to direct .reveal / .card
  // children so a group fans in rather than popping in all at once.
  document.querySelectorAll('.reveal-group').forEach(function (group) {
    var items = Array.prototype.slice.call(
      group.querySelectorAll(':scope > .reveal, :scope > .card')
    );
    items.forEach(function (item, i) {
      // Cap at 280 ms so the last item in a long list doesn't lag
      item.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
    });
  });

  // ── 4. IntersectionObserver reveal ──────────────────────────
  var SELECTOR =
    '.reveal, .section-header, .project-meta-grid, .project-images, ' +
    '.resume-section, .project-body, .study-pdf-embed, .about-body h2, .card';

  var targets = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!targets.length) return;

  var observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // animate once
      });
    },
    {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();
