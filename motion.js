
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

  function setPreview(row) {
    const img = $('[data-feature-img]');
    const title = $('[data-feature-title]');
    const meta = $('[data-feature-meta]');
    const link = $('[data-feature-link]');
    const viewer = $('.showcase__viewer');
    if (!row || !img || !title || !meta || !link) return;
    $$('.feature-row').forEach(r => r.classList.remove('is-active'));
    row.classList.add('is-active');
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = row.dataset.previewSrc;
      title.textContent = row.dataset.previewTitle;
      meta.textContent = row.dataset.previewMeta;
      link.href = row.dataset.previewLink;
      if (viewer) viewer.style.setProperty('--accent', getComputedStyle(row).getPropertyValue('--accent'));
      img.style.opacity = '1';
    }, 120);
  }
  $$('[data-feature-row]').forEach(row => {
    row.addEventListener('mouseenter', () => setPreview(row));
    row.addEventListener('focus', () => setPreview(row));
    row.addEventListener('click', () => setPreview(row));
  });

  $$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('[data-filter]').forEach(b => b.classList.toggle('is-active', b === btn));
    $$('[data-filter-card]').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.style.display = show ? '' : 'none';
    });
  }));

  if (!reduce) {
    $$('.atlas-card, .method-card, .workbench-card').forEach((card, idx) => {
      card.style.setProperty('--tilt', `${(idx % 2 ? 1 : -1) * 0.8}deg`);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `translateY(-8px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
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
