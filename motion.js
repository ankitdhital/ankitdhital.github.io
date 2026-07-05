
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

  // ── Project page: stacked-panel scroll story ──────────────────────────────
  if ($('.project-hero')) {
    const heroEl = $('.project-hero');
    const accentColor = heroEl ? getComputedStyle(heroEl).getPropertyValue('--accent').trim() : '';
    if (accentColor) document.documentElement.style.setProperty('--sa-accent', accentColor);

    const ANIMS = ['blur', 'right', 'up', 'scale', 'left', 'tilt'];

    let proseDiv = null;
    let proseSec = null;
    for (const sec of $$('.section')) {
      const d = sec.querySelector('.wrap > div');
      if (d && d.querySelector('h2')) { proseDiv = d; proseSec = sec; break; }
    }

    // Proximity snap: hero → story driver → photos → next → footer
    document.documentElement.classList.add('snap-page');
    $('.project-hero')?.classList.add('snap-pt');
    $$('.section').forEach(sec => {
      if (sec === proseSec || sec.querySelector('.fact-grid')) return;
      sec.classList.add('snap-pt');
    });
    $('.footer')?.classList.add('snap-pt');

    if (proseDiv) {
      if (proseSec) proseSec.style.padding = '0';
      proseDiv.classList.remove('reveal');
      proseDiv.style.opacity = '1';
      proseDiv.style.transform = 'none';
      io.unobserve(proseDiv);

      // Group nodes by h2 headings
      const nodes = [...proseDiv.childNodes];
      const groups = [];
      let cur = null;
      nodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'H2') {
          cur = { h2: node, rest: [] };
          groups.push(cur);
        } else if (cur) {
          cur.rest.push(node);
        }
      });

      const N = groups.length;
      if (!N) return;

      // Build: driver (tall scroll space) → stage (sticky 100vh) → panels (overlapping)
      const driver = document.createElement('div');
      driver.className = 'sa-driver';
      // (N+1)*100vh gives each of N panels exactly 100vh of scroll distance
      driver.style.height = `${(N + 1) * 100}vh`;

      const stage = document.createElement('div');
      stage.className = 'sa-stage';
      driver.appendChild(stage);

      const prog = document.createElement('div');
      prog.className = 'sa-prog';
      stage.appendChild(prog);

      const num = document.createElement('div');
      num.className = 'sa-num';
      num.textContent = '01';
      stage.appendChild(num);

      const lbl = document.createElement('div');
      lbl.className = 'sa-label';
      lbl.textContent = `01 / ${String(N).padStart(2, '0')}`;
      stage.appendChild(lbl);

      // Create one panel per h2 group — all stacked in the same stage
      const panels = groups.map(({ h2, rest }, idx) => {
        const panel = document.createElement('div');
        panel.className = 'sa-panel';
        panel.dataset.sa = idx === 0 ? 'specs' : ANIMS[(idx - 1) % ANIMS.length];
        h2.style.marginTop = '';
        panel.appendChild(h2);
        rest.forEach(n => panel.appendChild(n));
        panel.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--li-i', i));
        stage.appendChild(panel);
        return panel;
      });

      // Replace proseDiv with driver
      proseDiv.parentNode.insertBefore(driver, proseDiv);
      proseDiv.remove();

      if (!reduce) {
        const rail = document.createElement('nav');
        rail.className = 'sa-rail';
        rail.setAttribute('aria-label', 'Page sections');
        const pips = panels.map((panel, i) => {
          const p = document.createElement('button');
          p.className = 'sa-pip';
          p.setAttribute('aria-label', `Section ${i + 1}`);
          p.addEventListener('click', () => {
            const top = driver.offsetTop + (i / N) * (driver.offsetHeight - innerHeight);
            window.scrollTo({ top, behavior: 'smooth' });
          });
          rail.appendChild(p);
          return p;
        });
        document.body.appendChild(rail);

        let activeIdx = -1;

        function showPanel(idx) {
          if (idx === activeIdx) return;
          // Animate out the leaving panel
          if (activeIdx >= 0 && activeIdx < panels.length) {
            const prev = panels[activeIdx];
            prev.classList.remove('sa-in');
            prev.classList.add('sa-out');
            const captured = prev;
            setTimeout(() => captured.classList.remove('sa-out'), 240);
          }
          // Animate in the arriving panel
          if (idx >= 0 && idx < panels.length) {
            panels[idx].classList.add('sa-in');
            num.textContent = String(idx + 1).padStart(2, '0');
            lbl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
            prog.style.width = `${((idx + 1) / N) * 100}%`;
            pips.forEach((p, j) => p.classList.toggle('pip-on', j === idx));
            rail.classList.add('rail-on');
          }
          activeIdx = idx;
        }

        function onScroll() {
          const rect = driver.getBoundingClientRect();
          const scrollable = driver.offsetHeight - innerHeight;
          if (scrollable <= 0) return;

          // Driver not yet reached — hide active panel
          if (rect.top > 20) {
            if (activeIdx !== -1) {
              panels[activeIdx].classList.remove('sa-in');
              activeIdx = -1;
              rail.classList.remove('rail-on');
            }
            return;
          }
          // Driver fully scrolled past
          if (rect.bottom < innerHeight - 20) {
            rail.classList.remove('rail-on');
            return;
          }

          const progress = Math.max(0, -rect.top / scrollable);
          const idx = Math.min(Math.floor(progress * N), N - 1);
          showPanel(idx);
        }

        addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    }
  }
})();
