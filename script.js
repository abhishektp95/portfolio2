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

