// ------------------------------------------------------------------
// Abh1shyk Portfolio — interaction script
// (Previously this file called GSAP without the library being loaded
// on the page, so none of it ever ran. Rebuilt in plain JS below.)
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- One-time load-in sequence ---------- */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('loaded'));
  });

  /* ---------- Live REC timecode in hero HUD ---------- */
  const timecodeEl = document.getElementById('heroTimecode');
  if (timecodeEl && !reducedMotion) {
    const start = performance.now();
    const FPS = 24;
    const pad = n => String(n).padStart(2, '0');

    function tickClock() {
      const elapsed = performance.now() - start;
      const totalFrames = Math.floor(elapsed / (1000 / FPS));
      const frames = totalFrames % FPS;
      const totalSeconds = Math.floor(totalFrames / FPS);
      const seconds = totalSeconds % 60;
      const minutes = Math.floor(totalSeconds / 60) % 60;
      const hours = Math.floor(totalSeconds / 3600);
      timecodeEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
      requestAnimationFrame(tickClock);
    }
    requestAnimationFrame(tickClock);
  } else if (timecodeEl) {
    timecodeEl.textContent = '00:00:00:00';
  }

  /* ---------- Hover-to-preview on video cards ---------- */
  function formatTime(sec) {
    if (!isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function wireHoverPreview(card, videoSelector, imgSelector) {
    const video = card.querySelector(videoSelector);
    const img = card.querySelector(imgSelector);
    const scrubFill = card.querySelector('.scrub-fill');
    const timecode = card.querySelector('.media-timecode');
    if (!video) return;

    if (timecode) {
      video.addEventListener('loadedmetadata', () => {
        timecode.textContent = `${formatTime(0)} / ${formatTime(video.duration)}`;
      });
    }

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (scrubFill) scrubFill.style.width = pct + '%';
      if (timecode) timecode.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    });

    function startPreview() {
      img.style.opacity = '0';
      video.play().catch(() => {});
    }

    function stopPreview() {
      video.pause();
      video.currentTime = 0;
      img.style.opacity = '0.7';
      if (scrubFill) scrubFill.style.width = '0%';
    }

    card.addEventListener('mouseenter', startPreview);
    card.addEventListener('mouseleave', stopPreview);

    // Touch devices: tap toggles play/pause instead of relying on hover
    card.addEventListener('touchstart', () => {
      video.paused ? startPreview() : stopPreview();
    }, { passive: true });
  }

  document.querySelectorAll('.card').forEach(card => {
    wireHoverPreview(card, '.video-player', '.video-thumbnail');
  });

  const recentCard = document.querySelector('.recent-card');
  if (recentCard) {
    wireHoverPreview(recentCard, '.recent-video-player', '.recent-video-thumbnail');
  }

  /* ---------- Pause offscreen videos so they don't burn battery/data ---------- */
  const allVideos = document.querySelectorAll('.video-player, .recent-video-player');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          const v = entry.target;
          v.pause();
          v.currentTime = 0;
          const card = v.closest('.card, .recent-card');
          const img = card && card.querySelector('.video-thumbnail, .recent-video-thumbnail');
          const fill = card && card.querySelector('.scrub-fill');
          if (img) img.style.opacity = '0.7';
          if (fill) fill.style.width = '0%';
        }
      });
    }, { threshold: 0 });
    allVideos.forEach(v => io.observe(v));
  }

  /* ---------- Work filter pills ---------- */
  const filterPills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.card');
  const noResults = document.querySelector('.no-results');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter;
      let visibleCount = 0;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (noResults) noResults.hidden = visibleCount !== 0;
    });
  });

  /* ---------- Kinetic hero title: split into letters, spring in ---------- */
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    let i = 0;
    heroTitle.querySelectorAll('span').forEach(line => {
      const text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      [...text].forEach(chr => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.style.setProperty('--i', i++);
        ch.textContent = chr;
        line.appendChild(ch);
      });
    });
  }

  /* ---------- Scroll playhead: the page is a timeline ---------- */
  const playhead = document.querySelector('.playhead i');
  const scrollTc = document.getElementById('scrollTimecode');
  if (playhead) {
    const DURATION = 60; // page = 60s sequence at 24fps
    const pad2 = n => String(n).padStart(2, '0');
    const updatePlayhead = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      playhead.style.transform = `scaleX(${p})`;
      if (scrollTc) {
        const f = Math.floor(p * DURATION * 24);
        scrollTc.textContent = `00:00:${pad2(Math.floor(f / 24))}:${pad2(f % 24)}`;
      }
    };
    window.addEventListener('scroll', updatePlayhead, { passive: true });
    window.addEventListener('resize', updatePlayhead);
    updatePlayhead();
  }

  /* ---------- Ticker reacts to scroll velocity ---------- */
  const track = document.querySelector('.ticker-track');
  if (track && !reducedMotion && track.animate) {
    const anim = track.getAnimations()[0];
    let lastY = window.scrollY, rate = 1;
    const decay = () => {
      const y = window.scrollY;
      const target = 1 + Math.min(Math.abs(y - lastY) * 0.35, 8);
      lastY = y;
      rate += (target - rate) * 0.12;
      if (anim) anim.playbackRate = rate;
      requestAnimationFrame(decay);
    };
    requestAnimationFrame(decay);
  }

  /* ---------- Text scramble (headings on reveal, nav on hover) ---------- */
  const GLYPHS = '!<>-_/[]{}=+*^?#01';
  function scramble(el) {
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    clearInterval(el._t);
    if (reducedMotion) { el.textContent = final; return; }
    let frame = 0;
    el._t = setInterval(() => {
      el.textContent = [...final].map((c, i) =>
        c === ' ' || i < (frame - 4) / 1.5 ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
      if (++frame > final.length * 1.5 + 8) { clearInterval(el._t); el.textContent = final; }
    }, 30);
  }
  document.querySelectorAll('.nav-links a, .logo').forEach(a => a.addEventListener('mouseenter', () => scramble(a)));

  /* ---------- Typing tagline ---------- */
  const rot = document.getElementById('rotator');
  if (rot && !reducedMotion) {
    const words = ['reels', 'brand promos', 'VFX shots', 'explainers', 'model films'];
    let w = 0, n = 0, del = false;
    (function type() {
      const word = words[w];
      n += del ? -1 : 1;
      rot.textContent = word.slice(0, n);
      let delay = del ? 45 : 95;
      if (!del && n === word.length) { del = true; delay = 1400; }
      else if (del && n === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(type, delay);
    })();
  }

  /* ---------- Wipe-in reveals on scroll ---------- */
  const revealEls = document.querySelectorAll('.card, .recent-card, .about-text, .process li');
  revealEls.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (i % 4) * 90 + 'ms'; });
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        const sc = e.target.querySelector('[data-scramble]');
        if (sc) scramble(sc);
        ro.unobserve(e.target);
      }
    }), { threshold: 0.12 });
    revealEls.forEach(el => ro.observe(el));
    const hio = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { scramble(e.target); hio.unobserve(e.target); }
    }), { threshold: 0.6 });
    document.querySelectorAll('[data-scramble]').forEach(el => hio.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Magnetic contact link ---------- */
  const mag = document.querySelector('.footer-email');
  if (mag && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    mag.addEventListener('mousemove', e => {
      const r = mag.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.06;
      const y = (e.clientY - r.top - r.height / 2) * 0.12;
      mag.style.transform = `translate(${x}px, ${y}px)`;
    });
    mag.addEventListener('mouseleave', () => { mag.style.transform = ''; });
  }

  /* ---------- Hero: swelling letters + live curve field ---------- */
  const heroEl = document.querySelector('.hero');
  const chars = [...document.querySelectorAll('.hero-title .ch')];
  let hx = -9999, hy = -9999;
  if (heroTitle && chars.length) {
    setTimeout(() => heroTitle.classList.add('settled'), chars.length * 45 + 1300);
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      heroEl.addEventListener('mousemove', e => {
        chars.forEach(ch => {
          const r = ch.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          const k = Math.max(0, 1 - d / 240);
          ch.style.setProperty('--w', 640 + 160 * k);
          ch.style.setProperty('--y', (-14 * k) + 'px');
        });
      });
      heroEl.addEventListener('mouseleave', () => chars.forEach(ch => { ch.style.setProperty('--w', 640); ch.style.setProperty('--y', '0px'); }));
    }
  }

  const cv = document.getElementById('heroCanvas');
  if (cv && !reducedMotion) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, t = 0, sx = 0, sy = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
    heroEl.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); hx = e.clientX - r.left; hy = e.clientY - r.top; });
    heroEl.addEventListener('mouseleave', () => { hx = -9999; });
    const N = 16;
    (function draw() {
      requestAnimationFrame(draw);
      if (window.scrollY > window.innerHeight * 1.1) return;
      t += 0.012;
      if (hx > -9000) { sx += (hx - sx) * 0.08; sy += (hy - sy) * 0.08; }
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1), y0 = H * (0.08 + 0.84 * f);
        ctx.beginPath();
        for (let x = 0; x <= W + 10; x += 10) {
          const wave = Math.sin(x * 0.0035 + t * 1.2 + i * 0.4) * (18 + 26 * f) + Math.sin(x * 0.011 - t * 0.8 + i) * 8;
          const near = hx > -9000 ? Math.exp(-((x - sx) ** 2) / (2 * 170 ** 2)) * Math.exp(-((y0 - sy) ** 2) / (2 * 190 ** 2)) : 0;
          const y = y0 + wave - near * 90;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(237,221,212,${0.05 + 0.2 * f})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    })();
  }

  /* ---------- Cursor label on video cards ---------- */
  const curRing = document.querySelector('.cursor-ring');
  if (curRing) {
    document.querySelectorAll('.card, .recent-card').forEach(el => {
      el.addEventListener('mouseenter', () => { curRing.classList.add('big'); curRing.textContent = 'PLAY'; });
      el.addEventListener('mouseleave', () => { curRing.classList.remove('big'); curRing.textContent = ''; });
    });
  }

  /* ---------- Category chips on cards ---------- */
  const catNames = { 'motion-graphics': 'Motion graphics', 'vfx': 'VFX', 'video-editing': 'Video editing', 'social-content': 'Social content' };
  document.querySelectorAll('.card').forEach(card => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = catNames[card.dataset.category] || '';
    card.querySelector('.card-media').appendChild(chip);
  });

  /* ---------- RGB parade scope ---------- */
  const scope = document.getElementById('scope');
  if (scope) {
    const sctx = scope.getContext('2d');
    const cols = ['#c44536', '#197278', '#edddd4'];
    let sw = 0, sh = 0, st = 0;
    const sResize = () => {
      const r = scope.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      sw = r.width; sh = r.height; scope.width = sw * d; scope.height = sh * d; sctx.setTransform(d, 0, 0, d, 0, 0);
    };
    sResize(); window.addEventListener('resize', sResize);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    (function drawScope() {
      requestAnimationFrame(drawScope);
      if (window.scrollY > window.innerHeight * 1.2) return;
      st += reducedMotion ? 0 : 0.02;
      sctx.clearRect(0, 0, sw, sh);
      sctx.strokeStyle = 'rgba(237,221,212,0.1)'; sctx.lineWidth = 1;
      for (let g = 1; g < 5; g++) { sctx.beginPath(); sctx.moveTo(0, sh * g / 5); sctx.lineTo(sw, sh * g / 5); sctx.stroke(); }
      const pw = sw / 3;
      cols.forEach((col, c) => {
        sctx.fillStyle = col; sctx.globalAlpha = 0.55;
        for (let x = 6; x < pw - 6; x += 3) {
          const base = 0.5 - 0.28 * Math.sin(x * 0.045 + st + c * 1.3) - 0.1 * Math.sin(x * 0.13 - st * 1.6);
          for (let k = 0; k < 5; k++) sctx.fillRect(c * pw + x, (base + gauss() * 0.12) * sh, 2, 2);
        }
        if (c) { sctx.globalAlpha = 1; sctx.strokeStyle = 'rgba(237,221,212,0.15)'; sctx.beginPath(); sctx.moveTo(c * pw, 0); sctx.lineTo(c * pw, sh); sctx.stroke(); }
      });
      sctx.globalAlpha = 1;
    })();
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Nav background solidifies on scroll ---------- */
  const nav = document.querySelector('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Custom crosshair cursor (fine-pointer devices only) ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    if (dot && ring) {
      document.body.classList.add('has-custom-cursor');
      let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
      let ringX = mouseX, ringY = mouseY;

      window.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      });

      function animateRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
      }
      requestAnimationFrame(animateRing);

      document.querySelectorAll('a, button, .filter-pill, .card, .recent-card').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
      });
    }
  }

});

