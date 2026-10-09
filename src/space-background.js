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
  // Cheap 2D canvas: the stars are pre-rendered once to an offscreen layer; each frame blits that layer and redraws ~120 twinkling stars.
  // One static frame under reduced motion, with "pause background motion", while the tab is hidden and while the WebGL globe
  // (html.globe-on) is mounted, because it has a starfield of its own.
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const cl = document.documentElement.classList;
  const still = () => mq.matches || cl.contains('globe-on') || cl.contains('rm') || cl.contains('calm');
  const TWINKLE = 120;
  let w = 0, h = 0, base = null, twinkle = [], raf = 0, reduce = still();

  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const dot = (c, s, alpha) => {
    c.globalAlpha = alpha;
    c.fillStyle = s.r > 1.5 ? '#cfe3ff' : '#ffffff';
    c.beginPath();
    c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    c.fill();
  };

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    const count = Math.floor((innerWidth * innerHeight) / 700);
    const angle = -32 * Math.PI / 180;
    const stars = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      if (Math.random() < 0.35) {            // more stars along the Milky Way band
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
      });
    }
    // The first TWINKLE stars animate; the rest are baked once into the offscreen layer.
    twinkle = stars.slice(0, TWINKLE);
    base = document.createElement('canvas');
    base.width = w; base.height = h;
    const b = base.getContext('2d');
    for (let i = TWINKLE; i < stars.length; i++) dot(b, stars[i], stars[i].a * 0.82);
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    if (base) ctx.drawImage(base, 0, 0);
    for (const s of twinkle) dot(ctx, s, s.a * (reduce ? 1 : 0.65 + 0.35 * Math.sin(t * s.s + s.p)));
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
