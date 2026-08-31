// ------------------------------------------------------------------
// Abh1shyk Portfolio — interaction script
// (Previously this file called GSAP without the library being loaded
// on the page, so none of it ever ran. Rebuilt in plain JS below.)
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Hover-to-preview on video cards ---------- */
  function wireHoverPreview(card, videoSelector, imgSelector) {
    const video = card.querySelector(videoSelector);
    const img = card.querySelector(imgSelector);
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      img.style.opacity = '0';
      video.play().catch(() => {}); // ignore autoplay-blocked errors
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
      img.style.opacity = '0.7';
    });

    // Touch devices: tap toggles play/pause instead of relying on hover
    card.addEventListener('touchstart', () => {
      if (video.paused) {
        img.style.opacity = '0';
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
        img.style.opacity = '0.7';
      }
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
          if (img) img.style.opacity = '0.7';
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

});
