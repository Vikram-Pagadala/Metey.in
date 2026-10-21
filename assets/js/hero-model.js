/* Small homepage preview; full inspection tools live in the 3D Lab. */
(() => {
  const container = document.getElementById('hero-model-viewport');
  if (!container) return;
  const figure = container.closest('.hero-model');
  const fallback = figure.querySelector('.hero-model-fallback');
  const controls = figure.querySelector('.hero-model-controls');
  const hint = document.getElementById('hero-model-hint');
  const spinButton = document.getElementById('hero-model-spin');
  let viewer;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function start() {
    try {
      await loadScript('/assets/vendor/three.min.js');
      await loadScript('/assets/vendor/OrbitControls.js');
      await loadScript('/assets/js/3d-engine.js');
      viewer = window.createMetey3DViewer({
        container, mode: 'hero', initialTypology: 'jindal', initialXRay: 0.5, autoRotate: true
      });
      const spinning = viewer.toggleAutoRotate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      syncSpin(spinning);
      fallback.hidden = true;
      controls.hidden = false;
      hint.textContent = 'Drag to explore';
    } catch {
      viewer?.destroy();
      container.replaceChildren();
      hint.textContent = 'Explore the building in the 3D Lab';
    }
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-preview-mode]');
    if (!button || !viewer) return;
    const ratios = { architecture: 0, blend: 0.5, structure: 1 };
    viewer.setXRayRatio(ratios[button.dataset.previewMode]);
    controls.querySelectorAll('[data-preview-mode]').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });

  function syncSpin(spinning) {
    spinButton.setAttribute('aria-pressed', String(spinning));
    spinButton.textContent = spinning ? 'Pause spin' : 'Resume spin';
  }
  spinButton.addEventListener('click', () => {
    if (viewer) syncSpin(viewer.toggleAutoRotate());
  });

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    start();
  }, { rootMargin: '120px' });
  observer.observe(figure);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { observer.disconnect(); viewer?.destroy(); }
  });
})();
