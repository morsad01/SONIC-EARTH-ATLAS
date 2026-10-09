function setupSpaceBackground() {
  const canvas = document.getElementById('stars');
  if (!canvas) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupSpaceBackground);
    } else {
      setTimeout(setupSpaceBackground, 50);
    }
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Cheap 2D canvas. It stops (one static frame) under reduced motion and while the tab is hidden.
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || document.documentElement.classList.contains('rm');
  let w, h, stars = [], raf = 0, reduce = still();

  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    const count = Math.floor((innerWidth * innerHeight) / 700);
    const angle = -32 * Math.PI / 180;
    stars = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      if (Math.random() < 0.35) {            // Milky Way band-er upor beshi star
        const t = (Math.random() - 0.5) * w * 1.6;
        const off = gauss() * h * 0.14;
        x = w / 2 + t * Math.cos(angle) - off * Math.sin(angle);
        y = h * 0.52 + t * Math.sin(angle) + off * Math.cos(angle);
      } else { x = Math.random() * w; y = Math.random() * h; }
      stars.push({
        x, y,
        r: (Math.random() < 0.04 ? 1.8 : Math.random() * 1.1 + 0.2) * dpr,
        a: Math.random() * 0.7 + 0.3,
        s: Math.random() * 0.02 + 0.004,
        p: Math.random() * Math.PI * 2,
        d: Math.random() * 0.15 + 0.02        // drift speed
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(t * s.s + s.p);
      if (!reduce) { s.x += s.d * 0.05; if (s.x > w) s.x = 0; }
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = s.r > 1.5 ? '#cfe3ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = reduce || document.hidden ? 0 : requestAnimationFrame(draw);
  }
  const restart = () => {
    cancelAnimationFrame(raf);
    reduce = still();
    raf = document.hidden ? 0 : requestAnimationFrame(draw);
  };

  document.addEventListener('visibilitychange', restart);
  mq.addEventListener?.('change', restart);
  new MutationObserver(restart).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => { init(); restart(); });

  init();
  restart();
}

setupSpaceBackground();
