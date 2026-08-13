window.Hotsite = window.Hotsite || {};

Hotsite.scenario = {
  init: function () {
    var btn = document.querySelector('[data-impact-toggle]');
    var badges = document.querySelector('[data-impact-badges]');
    if (!btn || !badges) return;

    btn.addEventListener('click', function () {
      var isVisible = badges.classList.toggle('is-visible');
      btn.setAttribute('aria-expanded', String(isVisible));
      btn.textContent = isVisible ? 'Ocultar impacto real' : 'Ver o impacto real';
    });
  }
};
