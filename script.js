// GSAP Scroll Animations (Apple-like fade-ins)
gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray("section").forEach((section, i) => {
  if (i > 0) { // Skip hero section
    gsap.from(section, {
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
    });
  }
});

// Service card stagger animation
gsap.from(".service-card", {
  scrollTrigger: {
    trigger: ".services",
    start: "top 60%",
  },
  opacity: 0,
  y: 30,
  stagger: 0.1,
  duration: 0.6,
});
// Remove this section from your JavaScript:
// Auto-play videos on hover
document.querySelectorAll('.video-container').forEach(container => {
    const video = container.querySelector('video');
    
    container.addEventListener('mouseenter', () => {
        video.play().catch(e => console.log("Autoplay prevented:", e));
    });
    
    container.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });
});
