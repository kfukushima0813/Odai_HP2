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

  // ヒーロー画像1〜3をそれぞれ解析して求めたベースカラー。ロゴ・SCROLLの影を
  // その時表示されている画像の色になじませるために使う（is-blackは背景が明るい
  // 画像3向けなので、白寄りに薄く色みを残した明るいトーンにしている）
  const HERO_SHADOW_TONES = {
    image1: { tight: 'rgba(50, 52, 48, 0.8)', soft: 'rgba(50, 52, 48, 0.6)' },
    image2: { tight: 'rgba(45, 42, 36, 0.8)', soft: 'rgba(45, 42, 36, 0.6)' },
    image3Dark: { tight: 'rgba(69, 71, 69, 0.8)', soft: 'rgba(69, 71, 69, 0.6)' },
    image3Light: { tight: 'rgba(230, 236, 231, 0.95)', soft: 'rgba(230, 236, 231, 0.85)' }
  };

  function setLogoShadow(tone) {
    logoEl.style.setProperty('--logo-shadow-tight', tone.tight);
    logoEl.style.setProperty('--logo-shadow-soft', tone.soft);
  }

  function setScrollShadow(tone) {
    scrollEl.style.setProperty('--scroll-shadow-tight', tone.tight);
    scrollEl.style.setProperty('--scroll-shadow-soft', tone.soft);
  }

  // ロゴとSCROLLの両方に同じトーンを適用する。SCROLLの文字は常に白色なので、
  // ロゴが黒に変わる際の明るいトーン（image3Light）はこの共通関数を使わず
  // setLogoShadow()だけを呼び出し、SCROLLは暗いトーンのまま据え置く
  function setHeroShadow(tone) {
    setLogoShadow(tone);
    setScrollShadow(tone);
  }

  function revealMessageIntro() {
    // DOM順（キャッチコピー→画像）とは表示順を変え、画像・イラストが
    // ある程度動き終わってからキャッチコピーが追いかけるように登場させる
    const introTl = gsap.timeline();
    introTl
      .fromTo(
        '.msg-image-wrap',
        { y: 100 },
        { y: 0, duration: 1, ease: 'power2.out' }
      )
      .fromTo(
        '.msg-catch-wrap',
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.65'
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

    // ロゴの色/影の切り替えはここでは行わない。早くスクロールして格納しても
    // ヒーロー本編のtl（画像のクロスフェード・ズーム）はそのまま裏で続き、
    // 画像3のズームが終わるタイミングで統一して黒に切り替わる
    headerEl.classList.add('is-visible');
  }

  function initHeroTimeline() {
    lockScroll();

    gsap.set(heroImages, { opacity: 0, scale: 1 });
    gsap.set(catchEl, { opacity: 0, clearProps: 'color,textShadow' });
    gsap.set(scrollEl, { opacity: 0 });
    gsap.set(logoEl, { opacity: 0 });
    logoEl.classList.remove('is-black');
    logoEl.classList.add('is-white');
    setHeroShadow(HERO_SHADOW_TONES.image1);

    tl = gsap.timeline({
      delay: 0.7 // 最初のキャッチコピーが出るまでのディレイ
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
      .to(catchEl, { color: '#ffffff', textShadow: '0 2px 6px rgba(0, 0, 0, 0.35)', duration: 0.3 }, imageStart)
      .to(scrollEl, { opacity: 1, duration: 0.6 }, imageStart)
      .to(catchEl, { opacity: 0, duration: 0.6 }, 4.0)
      .to(heroImages[0], { opacity: 0, duration: crossfade, ease: 'sine.inOut' }, img1FadeOutStart)
      // 画像2（画像1とクロスフェード）
      .to(heroImages[1], { opacity: 1, duration: crossfade, ease: 'sine.inOut' }, img1FadeOutStart)
      .to(heroImages[1], { scale: 1.12, duration: displayDur, ease: 'none' }, img1FadeOutStart)
      .call(() => setHeroShadow(HERO_SHADOW_TONES.image2), [], img1FadeOutStart)
      .to(logoEl, { opacity: 1, duration: 1 }, 5.6)
      .to(heroImages[1], { opacity: 0, duration: crossfade, ease: 'sine.inOut' }, img2FadeOutStart)
      // 画像3（画像2とクロスフェード、以降は静止背景として残る。ズーム自体は18秒継続）
      .to(heroImages[2], { opacity: 1, duration: crossfade, ease: 'sine.inOut' }, img2FadeOutStart)
      .to(heroImages[2], { scale: 1.35, duration: lastZoomDur, ease: 'none' }, img2FadeOutStart)
      .call(() => setHeroShadow(HERO_SHADOW_TONES.image3Dark), [], img2FadeOutStart)
      // 最後の画像が表示されてから4秒後、スクロールされていなければ自動で格納する
      .call(() => {
        if (isDesktop()) dockHero();
      }, [], img2FadeOutStart + autoDockDelay)
      // 画像3のズームが終わるタイミングで、ロゴの色/影を画像3向け（明るいトーン）に
      // 切り替える。PCで早くスクロールして格納済みでも、このタイミングまでは
      // 白ロゴのまま保つ。SCROLLは白文字のままなのでこの影は変えない
      .call(() => {
        logoEl.classList.remove('is-white');
        logoEl.classList.add('is-black');
        setLogoShadow(HERO_SHADOW_TONES.image3Light);
      }, [], img2FadeOutStart + lastZoomDur)
      // 画像1が表示されるより前にスクロールされると、何も表示されないまま
      // dockHero()が呼ばれて真っ白な背景になってしまうため、画像1が
      // 出終わるタイミングまではスクロールでの格納を受け付けないようにする
      .call(() => {
        addScrollIntentListeners(() => {
          if (!isDesktop()) return;
          dockHero();
        });
      }, [], imageStart + crossfade);
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

    // ボディ側の.reveal・.reveal-box・サービス項目などのScrollTriggerは
    // 一度再生されると再生済みのまま戻らないため、破棄してから登録し直し、
    // トップに戻ったら再びスクロールで見られるようにリセットする
    ScrollTrigger.getAll().forEach((st) => st.kill());
    ScrollTrigger.clearMatchMedia();
    initReveals();

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

  // dockHero()がheroEl.styleに直接書き込むwidth:50vwは、インラインスタイルのため
  // モバイル用メディアクエリのwidth指定より優先されてしまう。デスクトップ→モバイルへの
  // リサイズ時にこの残留インラインwidthを解除し、CSS側のwidth:100%を効かせる
  function syncHeroWidthForViewport() {
    if (!isDesktop()) {
      gsap.set(heroEl, { clearProps: 'width' });
    } else if (docked) {
      gsap.set(heroEl, { width: '50vw' });
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
    gsap.utils.toArray('.reveal:not(.service-item__media)').forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40 },
        {
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        }
      );
    });

    // サービス項目は「1.イメージ画像 → 2.背景ボックス」の順で登場させるため、
    // 項目ごとに1本のタイムラインにまとめてscrollTriggerを掛ける
    gsap.utils.toArray('.service-item').forEach((item) => {
      const media = item.querySelector('.service-item__media');
      const box = item.querySelector('.reveal-box');
      const dir = box.dataset.direction || 'center';
      // 固定pxではなく自身の幅の100%分ずらすことで、静止位置がボディの端に
      // 揃っているボックス（事業2は左端、事業3は右端）がその端からちょうど
      // 現れるようにする
      const fromXPercent = dir === 'left' ? -100 : dir === 'right' ? 100 : 0;
      const fromY = dir === 'center' ? 40 : 0;

      // ボックスは自身の幅の100%分移動するため、幅が異なる事業1（50vw）は
      // 他（35vw）と同じdurationだと移動速度が速く感じてしまう。
      // 基準（35vw = 0.6秒）に対する幅の比率でdurationを揃え、体感速度を統一する。
      // モバイルはボックス幅が画面に対して広くなりがちで、この計算のままだと
      // duration が伸びて遅く感じるため、開始タイミングはそのままに速度だけ上げる
      const baseDuration = 0.6;
      const baseWidthVw = 35;
      const mobileSpeedFactor = isDesktop() ? 1 : 0.6;
      const boxWidthVw = (box.getBoundingClientRect().width / window.innerWidth) * 100;
      const boxDuration = baseDuration * (boxWidthVw / baseWidthVw) * mobileSpeedFactor;

      const itemTl = gsap.timeline({
        scrollTrigger: { trigger: item, start: 'top 70%' }
      });

      itemTl
        .fromTo(media, { y: 40 }, { y: 0, duration: 0.9, ease: 'power2.out' })
        .fromTo(box, { xPercent: fromXPercent, y: fromY }, { xPercent: 0, y: 0, duration: boxDuration, ease: 'power2.out' }, '-=0.1');
    });

    // モバイル（ヒーローが格納されないレイアウト）では、ドッキングイベントが
    // 発生しないため、こちらは通常のスクロールインで表示する。
    // isDesktop()を読み込み時に一度だけ判定すると、デスクトップ幅で開いた後に
    // 縦積みへリサイズした場合に登録されずアニメーションが動かなくなるため、
    // ブレイクポイントをまたぐ度に登録/破棄されるmatchMediaを使う
    ScrollTrigger.matchMedia({
      '(max-width: 1025px)': () => {
        // .msg-image-wrapと.msg-catch-wrapは負のマージンで縦位置が近く、
        // それぞれ独立したscrollTriggerだとほぼ同時に発火して重なって見えるため、
        // デスクトップ版と同じ「画像→キャッチコピー」の順で1本のタイムラインにまとめる
        gsap.timeline({
          scrollTrigger: { trigger: '.msg-image-wrap', start: 'top 72%' }
        })
          .fromTo('.msg-image-wrap', { y: 120 }, { y: 0, duration: 0.9, ease: 'power2.out' })
          .fromTo(
            '.msg-catch-wrap',
            { opacity: 0, y: 120 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
            '-=0.75'
          );
      }
    });
  }

  initHeroTimeline();
  initHeaderForViewport();
  initReveals();

  window.addEventListener('resize', initHeaderForViewport);
  window.addEventListener('resize', syncHeroWidthForViewport);
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
