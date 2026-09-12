
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menuButton = $('[data-menu-button]');
  const menu = $('[data-site-menu]');
  if (menuButton && menu) menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  const ruler = $('[data-scroll-ruler] span');
  function updateRuler(){
    if(!ruler) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    ruler.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }
  addEventListener('scroll', updateRuler, {passive:true}); updateRuler();

  $$('[data-split-text]').forEach((el) => {
    const raw = el.textContent.trim();
    el.setAttribute('aria-label', raw);
    let i = 0;
    el.innerHTML = raw.split(/(\s+)/).map(part => {
      if (/^\s+$/.test(part)) return part;
      const chars = [...part].map(ch => `<span class="char" style="--i:${i++}" aria-hidden="true">${ch}</span>`).join('');
      return `<span class="word" aria-hidden="true">${chars}</span>`;
    }).join('');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (!entry.target.matches('[data-split-text]')) io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, [data-split-text]').forEach(el => io.observe(el));

  $$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('[data-filter]').forEach(b => b.classList.toggle('is-active', b === btn));
    $$('[data-filter-card]').forEach(card => {
      const show = f === 'all' || card.dataset.cat.split(/\s+/).includes(f);
      card.style.display = show ? '' : 'none';
    });
  }));

  if (!reduce) {
    $$('.atlas-card:not([data-fan-card]), .method-card, .workbench-card').forEach((card, idx) => {
      card.style.setProperty('--tilt', `${(idx % 2 ? 1 : -1) * 0.8}deg`);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `translateY(-8px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }

  // Featured cards: pinned scroll-scrub. Cards start stacked dead-center
  // (overlapping the middle card) and translate/scale out to their own
  // natural grid slot as the user scrolls through the tall `.feature-fan`
  // spacer — progress 0 = fully stacked, progress 1 = exactly aligned to
  // the untouched CSS grid layout, so the landing is always pixel-perfect.
  const fan = $('[data-feature-fan]');
  if (fan) {
    const fanCards = $$('[data-fan-card]', fan);
    const desktopMq = matchMedia('(min-width:981px)');
    let starts = [];
    let scrubbing = false;

    const measure = () => {
      fanCards.forEach(c => { c.style.transform = ''; });
      const rects = fanCards.map(c => c.getBoundingClientRect());
      const mid = rects[1];
      const midCenter = { x: mid.left + mid.width / 2, y: mid.top + mid.height / 2 };
      starts = rects.map((r, i) => {
        if (i === 1) return { dx: 0, dy: 0, scale: .88 };
        const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        return { dx: midCenter.x - center.x, dy: midCenter.y - center.y, scale: .8 };
      });
    };

    const apply = (progress) => {
      fanCards.forEach((card, i) => {
        const s = starts[i];
        const dx = s.dx * (1 - progress);
        const dy = s.dy * (1 - progress);
        const scale = s.scale + (1 - s.scale) * progress;
        card.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        card.style.zIndex = i === 1 ? 3 : 1;
      });
    };

    const update = () => {
      if (!scrubbing) return;
      const rect = fan.getBoundingClientRect();
      const total = fan.offsetHeight - innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      apply(progress);
    };

    const setup = () => {
      if (reduce || !desktopMq.matches) {
        scrubbing = false;
        fanCards.forEach(c => { c.style.transform = ''; c.style.zIndex = ''; });
        return;
      }
      scrubbing = true;
      measure();
      update();
    };

    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', setup);
    setup();
    // Re-measure once everything (webfonts, images) has actually settled —
    // a measurement taken too early can catch the grid mid-reflow. `load`
    // may already have fired by the time this deferred script runs, so
    // don't rely on the event alone.
    if (document.readyState === 'complete') setTimeout(setup, 50);
    else addEventListener('load', () => setTimeout(setup, 50));
  }

  const command = $('[data-command]');
  const openers = $$('[data-command-open]');
  const closer = $('[data-command-close]');
  let lastFocused = null;
  const open = () => {
    if(!command) return;
    lastFocused = document.activeElement;
    command.classList.add('is-open');
    command.setAttribute('aria-hidden','false');
    const firstLink = command.querySelector('.command__links a, [data-command-close]');
    if (firstLink) firstLink.focus();
  };
  const close = () => {
    if(!command) return;
    command.classList.remove('is-open');
    command.setAttribute('aria-hidden','true');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };
  openers.forEach(b => b.addEventListener('click', open));
  if(closer) closer.addEventListener('click', close);
  if(command) command.addEventListener('click', e => { if(e.target === command) close(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && command && command.classList.contains('is-open')) close();
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    if (e.key === 'Tab' && command && command.classList.contains('is-open')) {
      const focusable = $$('.command__links a, [data-command-close]', command);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

})();
