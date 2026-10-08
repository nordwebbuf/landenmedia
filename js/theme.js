// Theme toggle for the simple pages (privacy policy, 404)
(() => {
  const root = document.documentElement;
  const en = root.lang === 'en';
  const btn = document.querySelector('[data-theme-toggle]');
  const icon = document.querySelector('[data-theme-icon]');
  const sys = window.matchMedia('(prefers-color-scheme: dark)');
  const dark = () => (root.getAttribute('data-theme') || (sys.matches ? 'dark' : 'light')) === 'dark';
  const sync = () => {
    icon.className = `ph-light ${dark() ? 'ph-sun' : 'ph-moon'}`;
    btn.setAttribute('aria-label', dark() ? (en ? 'Switch to light mode' : 'Byt till ljust läge') : (en ? 'Switch to dark mode' : 'Byt till mörkt läge'));
  };
  btn.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    sync();
  });
  sys.addEventListener('change', sync);
  sync();
})();
