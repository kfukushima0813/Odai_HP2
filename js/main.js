document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const heroEl = document.querySelector('.hero');
  const heroImages = document.querySelectorAll('.hero__image');
  const catchEl = document.querySelector('.hero__catch');
  const scrollEl = document.querySelector('.hero__scroll');
  const logoEl = document.querySelector('.hero__logo');
  const headerEl = document.querySelector('.site-header');

  const isDesktop = () => window.matchMedia('(min-width: 1026px)').matches;

  let docked = false;

  function dockHero() {
    if (docked || !isDesktop()) return;
    docked = true;

    gsap.to(heroEl, { width: '50vw', duration: 1.2, ease: 'power2.inOut' });
    gsap.to(scrollEl, { opacity: 0, duration: 0.4 });

    logoEl.classList.remove('is-white');
    logoEl.classList.add('is-black');

    headerEl.classList.add('is-visible');
  }

  function initHeroTimeline() {
    gsap.set(heroImages, { opacity: 0, scale: 1 });
    gsap.set(catchEl, { opacity: 0 });
    gsap.set(scrollEl, { opacity: 0 });
    gsap.set(logoEl, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        if (isDesktop()) setTimeout(dockHero, 4000);
      }
    });

    tl.to(catchEl, { opacity: 1, duration: 0.8, ease: 'power1.out' }, 0)
      .to(heroImages[0], { opacity: 1, scale: 1.12, duration: 4, ease: 'none' }, 0.8)
      .to(catchEl, { color: '#ffffff', duration: 0.3 }, 0.8)
      .to(scrollEl, { opacity: 1, duration: 0.6 }, 0.8)
      .to(catchEl, { opacity: 0, duration: 0.6 }, 4.0)
      .to(heroImages[0], { opacity: 0, duration: 1 }, 4.8)
      .to(heroImages[1], { opacity: 1, scale: 1.12, duration: 4, ease: 'none' }, 4.8)
      .to(logoEl, { opacity: 1, duration: 1 }, 5.6)
      .to(heroImages[1], { opacity: 0, duration: 1 }, 8.8)
      .to(heroImages[2], { opacity: 1, scale: 1.35, duration: 18, ease: 'none' }, 8.8);

    function onScrollDock() {
      if (!isDesktop()) return;
      dockHero();
      window.removeEventListener('scroll', onScrollDock);
    }
    window.addEventListener('scroll', onScrollDock, { passive: true });
  }

  function initHeaderForViewport() {
    if (!isDesktop()) {
      headerEl.classList.add('is-visible');
    } else if (!docked) {
      headerEl.classList.remove('is-visible');
    }
  }

  function handleTinyHeader() {
    if (window.matchMedia('(max-width: 330px)').matches) {
      const threshold = heroEl.offsetHeight - 80;
      if (window.scrollY > threshold) {
        headerEl.classList.add('is-scrolled');
      } else {
        headerEl.classList.remove('is-scrolled');
      }
    } else {
      headerEl.classList.remove('is-scrolled');
    }
  }

  function initReveals() {
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        }
      );
    });

    gsap.utils.toArray('.reveal-box').forEach((el) => {
      const dir = el.dataset.direction || 'center';
      const fromX = dir === 'left' ? -80 : dir === 'right' ? 80 : 0;
      const fromY = dir === 'center' ? 40 : 0;

      gsap.fromTo(
        el,
        { opacity: 0, x: fromX, y: fromY },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });
  }

  initHeroTimeline();
  initHeaderForViewport();
  initReveals();

  window.addEventListener('resize', initHeaderForViewport);
  window.addEventListener('scroll', handleTinyHeader, { passive: true });

  const pageTopBtn = document.getElementById('pageTopBtn');
  const pageTopLink = document.getElementById('pageTopLink');
  [pageTopBtn, pageTopLink].forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});
