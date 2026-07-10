document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const htmlEl = document.documentElement;
  const heroEl = document.querySelector('.hero');
  const heroImages = document.querySelectorAll('.hero__image');
  const catchEl = document.querySelector('.hero__catch');
  const scrollEl = document.querySelector('.hero__scroll');
  const logoEl = document.querySelector('.hero__logo');
  const headerEl = document.querySelector('.site-header');

  const isDesktop = () => window.matchMedia('(min-width: 1026px)').matches;

  let docked = false;
  let tl = null;
  let scrollIntentListeners = [];

  const SCROLL_KEYS = [' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];

  function lockScroll() {
    if (isDesktop()) htmlEl.classList.add('hero-scroll-lock');
  }

  function unlockScroll() {
    htmlEl.classList.remove('hero-scroll-lock');
  }

  function addScrollIntentListeners(handler) {
    // wheel/touchmoveはこのイベント自体のデフォルトスクロールも止めるため
    // 非passiveにしてpreventDefaultする（overflow:hiddenだけに頼らない二重の保険）
    const onWheel = (e) => {
      e.preventDefault();
      handler();
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      handler();
    };
    const onKeydown = (e) => {
      if (!SCROLL_KEYS.includes(e.key)) return;
      e.preventDefault();
      window.removeEventListener('keydown', onKeydown);
      handler();
    };
    window.addEventListener('wheel', onWheel, { passive: false, once: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, once: true });
    window.addEventListener('keydown', onKeydown);
    scrollIntentListeners = [
      ['wheel', onWheel],
      ['touchmove', onTouchMove],
      ['keydown', onKeydown]
    ];
  }

  function removeScrollIntentListeners() {
    scrollIntentListeners.forEach(([type, handler]) => window.removeEventListener(type, handler));
    scrollIntentListeners = [];
  }

  function revealMessageIntro() {
    gsap.fromTo(
      '.msg-fadeup',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.15 }
    );
  }

  function dockHero() {
    if (docked || !isDesktop()) return;
    docked = true;
    removeScrollIntentListeners();

    // 格納自体はすばやく行い（0.6秒）、ふわっと登場するアニメーションは
    // 格納開始と同時にスタートする。要素によって露出するタイミングが
    // 異なる（右寄せの画像は早め、左寄りの文字は遅め）ため、
    // 見え始めた瞬間には既にアニメーションが進行中になるようにする
    const dockDuration = 0.6;

    const dockTl = gsap.timeline({
      onComplete: unlockScroll
    });
    dockTl.to(heroEl, { width: '50vw', duration: dockDuration, ease: 'power2.out' }, 0);

    revealMessageIntro();

    gsap.to(scrollEl, { opacity: 0, duration: 0.4 });

    logoEl.classList.remove('is-white');
    logoEl.classList.add('is-black');

    headerEl.classList.add('is-visible');
  }

  function initHeroTimeline() {
    lockScroll();

    gsap.set(heroImages, { opacity: 0, scale: 1 });
    gsap.set(catchEl, { opacity: 0, clearProps: 'color' });
    gsap.set(scrollEl, { opacity: 0 });
    gsap.set(logoEl, { opacity: 0 });

    tl = gsap.timeline({
      delay: 1.2 // 最初のキャッチコピーが出るまでのディレイ
    });

    // 最初の画像が表示されるまでのディレイ
    const imageStart = 2.2;
    const displayDur = 4;   // 画像1・画像2の表示時間
    const crossfade = 1.2;  // クロスフェードの長さ
    const lastZoomDur = 18; // 最後の画像のズーム時間（見た目上のアニメーション）
    const autoDockDelay = 4; // 最後の画像が表示されてから格納するまでの待機時間

    const img1FadeOutStart = imageStart + displayDur - crossfade;
    const img2FadeOutStart = img1FadeOutStart + displayDur - crossfade;

    tl.to(catchEl, { opacity: 1, duration: 0.8, ease: 'power1.out' }, 0)
      // 画像1
      .to(heroImages[0], { opacity: 1, duration: crossfade, ease: 'sine.inOut' }, imageStart)
      .to(heroImages[0], { scale: 1.12, duration: displayDur, ease: 'none' }, imageStart)
      .to(catchEl, { color: '#ffffff', duration: 0.3 }, imageStart)
      .to(scrollEl, { opacity: 1, duration: 0.6 }, imageStart)
      .to(catchEl, { opacity: 0, duration: 0.6 }, 4.0)
      .to(heroImages[0], { opacity: 0, duration: crossfade, ease: 'sine.inOut' }, img1FadeOutStart)
      // 画像2（画像1とクロスフェード）
      .to(heroImages[1], { opacity: 1, duration: crossfade, ease: 'sine.inOut' }, img1FadeOutStart)
      .to(heroImages[1], { scale: 1.12, duration: displayDur, ease: 'none' }, img1FadeOutStart)
      .to(logoEl, { opacity: 1, duration: 1 }, 5.6)
      .to(heroImages[1], { opacity: 0, duration: crossfade, ease: 'sine.inOut' }, img2FadeOutStart)
      // 画像3（画像2とクロスフェード、以降は静止背景として残る。ズーム自体は18秒継続）
      .to(heroImages[2], { opacity: 1, duration: crossfade, ease: 'sine.inOut' }, img2FadeOutStart)
      .to(heroImages[2], { scale: 1.35, duration: lastZoomDur, ease: 'none' }, img2FadeOutStart)
      // 最後の画像が表示されてから4秒後、スクロールされていなければ自動で格納する
      .call(() => {
        if (isDesktop()) dockHero();
      }, [], img2FadeOutStart + autoDockDelay);

    addScrollIntentListeners(() => {
      if (!isDesktop()) return;
      dockHero();
    });
  }

  function restartHeroIntro() {
    removeScrollIntentListeners();
    if (tl) tl.kill();
    docked = false;

    logoEl.classList.remove('is-black');
    logoEl.classList.add('is-white');

    if (isDesktop()) {
      gsap.set(heroEl, { width: '100vw' });
      headerEl.classList.remove('is-visible');
    }

    // scroll-behavior:smooth の影響を受けないよう明示的に instant で即時リセットする
    window.scrollTo({ top: 0, behavior: 'instant' });
    initHeroTimeline();
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

    // モバイル（ヒーローが格納されないレイアウト）では、ドッキングイベントが
    // 発生しないため、こちらは通常のスクロールインで表示する
    if (!isDesktop()) {
      gsap.utils.toArray('.msg-fadeup').forEach((el) => {
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
    }
  }

  initHeroTimeline();
  initHeaderForViewport();
  initReveals();

  window.addEventListener('resize', initHeaderForViewport);
  window.addEventListener('scroll', handleTinyHeader, { passive: true });

  const pageTopBtn = document.getElementById('pageTopBtn');
  const pageTopLink = document.getElementById('pageTopLink');

  pageTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  pageTopLink.addEventListener('click', (e) => {
    e.preventDefault();
    restartHeroIntro();
  });
});
