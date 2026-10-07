document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = s => isFinite(s) ? String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '00:00';
  const cards = $$('.card');

  /* Theme */
  const root = document.documentElement, tb = $('#themeBtn');
  const setTheme = t => { root.dataset.theme = t; tb.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; try { localStorage.setItem('theme', t); } catch (e) {} };
  let saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  tb.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* Hover preview + missing-file message */
  cards.forEach(card => {
    const v = $('video', card), img = $('.thumb', card), fill = $('.scrub i', card), time = $('.time', card), media = $('.media', card), src = $('source', v);
    v.addEventListener('loadedmetadata', () => { time.textContent = '00:00 / ' + fmt(v.duration); });
    v.addEventListener('timeupdate', () => { if (!v.duration) return; fill.style.width = (v.currentTime / v.duration * 100) + '%'; time.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration); });
    card.addEventListener('mouseenter', () => { if (img) img.style.opacity = '0'; v.play().catch(() => {}); });
    card.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; if (img) img.style.opacity = '1'; fill.style.width = '0%'; });
    src.addEventListener('error', () => { media.classList.add('missing'); media.dataset.missing = 'Video not found: ' + decodeURIComponent(src.getAttribute('src').split('#')[0]); });
  });

  /* Project popup with prev/next */
  const dlg = $('#player'), pv = $('video', dlg);
  let cur = 0;
  const visible = () => cards.filter(c => c.style.display !== 'none');
  const show = card => {
    cur = visible().indexOf(card);
    $('video', card).pause();
    pv.src = $('source', card).getAttribute('src').split('#')[0];
    $('#dTitle').textContent = card.dataset.title; $('#dCat').textContent = card.dataset.cat;
    $('#dDesc').textContent = card.dataset.desc; $('#dRole').textContent = card.dataset.role;
    if (!dlg.open) dlg.showModal();
    pv.play().catch(() => {});
  };
  const step = d => { const l = visible(); show(l[(cur + d + l.length) % l.length]); };
  cards.forEach(c => { c.addEventListener('click', () => show(c)); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(c); } }); });
  const closeDlg = () => { pv.pause(); pv.removeAttribute('src'); pv.load(); dlg.close(); };
  $('.close', dlg).addEventListener('click', closeDlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  $('#prev').addEventListener('click', () => step(-1)); $('#next').addEventListener('click', () => step(1));
  $('#dHire').addEventListener('click', closeDlg);
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  dlg.addEventListener('close', () => pv.pause());

  /* Filters + count */
  const grid = $$('.grid .card'), filters = $$('.filter'), empty = $('.empty');
  $('#projectCount').textContent = grid.length + 1;
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => x.classList.remove('active')); f.classList.add('active');
    let n = 0; grid.forEach(c => { const ok = f.dataset.filter === 'all' || c.dataset.category === f.dataset.filter; c.style.display = ok ? '' : 'none'; if (ok) n++; });
    empty.hidden = n !== 0;
  }));

  /* Clean motion reveal */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

    cards.forEach((card, i) => {
      card.style.setProperty('--delay', Math.min(i * 45, 180) + 'ms');
      io.observe(card);
    });
  } else {
    cards.forEach(card => card.classList.add('in'));
  }

  /* Subtle pointer motion — desktop only, no aggressive 3D tilt */
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    $$('.media').forEach(media => {
      media.addEventListener('pointermove', e => {
        const r = media.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - .5) * 2;
        const y = ((e.clientY - r.top) / r.height - .5) * 2;
        media.style.setProperty('--mx', (x * 2.5).toFixed(2) + 'px');
        media.style.setProperty('--my', (y * 2.5).toFixed(2) + 'px');
      });
      media.addEventListener('pointerleave', () => {
        media.style.setProperty('--mx', '0px');
        media.style.setProperty('--my', '0px');
      });
    });
  }

  /* Tabs follow scroll */
  const tabs = $$('.tab'), secs = tabs.map(t => $(t.getAttribute('href')));
  const spy = () => { let c = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top < 190) c = i; }); tabs.forEach((t, i) => t.classList.toggle('active', i === c)); };
  addEventListener('scroll', spy, { passive: true }); spy();

  /* Contact form opens email app, prefilled */
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `Hi Abhishek,\n\n${f.get('msg')}\n\nProject type: ${f.get('type')}\nFrom: ${f.get('name')} (${f.get('email')})`;
    location.href = `mailto:abhiramkuttutp@gmail.com?subject=${encodeURIComponent('Project enquiry: ' + f.get('type'))}&body=${encodeURIComponent(body)}`;
  });
});
